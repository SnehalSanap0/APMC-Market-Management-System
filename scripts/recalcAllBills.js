import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function autoUpdateMerchantBills(billDate, merchantIds) {
    const uniqueMerchants = [...new Set(merchantIds.filter(Boolean))];

    for (const merchantId of uniqueMerchants) {
        // 1. Sum hishob
        const { data: allItems } = await supabase
            .from('hishob_items')
            .select(`amount, hishob_entries!inner(date)`)
            .eq('merchant_id', merchantId)
            .eq('hishob_entries.date', billDate);

        const hishobTotal = (allItems || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

        // 2. Sum vatap
        const [{ data: vatapGiven }, { data: vatapReceived }] = await Promise.all([
            supabase.from('vatap_entries').select('amount').eq('from_merchant_id', merchantId).eq('date', billDate),
            supabase.from('vatap_entries').select('amount').eq('to_merchant_id', merchantId).eq('date', billDate),
        ]);

        const vatapGivenTotal = (vatapGiven || []).reduce((s, v) => s + (parseFloat(v.amount) || 0), 0);
        const vatapReceivedTotal = (vatapReceived || []).reduce((s, v) => s + (parseFloat(v.amount) || 0), 0);

        const mGrossTotal = hishobTotal + vatapReceivedTotal - vatapGivenTotal;

        const { data: existingBill } = await supabase
            .from('merchant_bills')
            .select('id')
            .eq('date', billDate)
            .eq('merchant_id', merchantId)
            .maybeSingle();

        // Delete if orphaned
        if (hishobTotal === 0 && vatapGivenTotal === 0 && vatapReceivedTotal === 0) {
            if (existingBill) {
                console.log(`DELETING ORPHANED BILL: Date ${billDate}, Merchant ${merchantId}`);
                await supabase.from('dhada_entries').delete().eq('bill_id', existingBill.id);
                await supabase.from('merchant_bills').delete().eq('id', existingBill.id);
            }
            continue;
        }

        const mFees = {
            marketFee: mGrossTotal * 0.06,
            supervision: mGrossTotal * 0.01,
            donation: mGrossTotal * 0.0005,
            commission: 1, 
        };
        const mTotalCharges = mFees.marketFee + mFees.supervision + mFees.donation + mFees.commission;
        const mNetAmount = mGrossTotal + mTotalCharges;

        if (existingBill) {
            await supabase.from('merchant_bills').update({
                gross_total: mGrossTotal, market_fee: mFees.marketFee, supervision_fee: mFees.supervision,
                donation: mFees.donation, commission: mFees.commission, total_charges: mTotalCharges, net_amount: mNetAmount
            }).eq('id', existingBill.id);
            
            await supabase.from('dhada_entries').update({
                market_fee: mFees.marketFee, supervision_fee: mFees.supervision, donation: mFees.donation, commission: mFees.commission, total_income: mTotalCharges
            }).eq('bill_id', existingBill.id);
        }
    }
}

async function run() {
    console.log("Fetching all existing merchant bills...");
    const { data: bills } = await supabase.from('merchant_bills').select('date, merchant_id');
    
    if (!bills) {
        console.log("No bills found.");
        return;
    }
    
    console.log(`Found ${bills.length} bills. Recalculating...`);
    for (let i = 0; i < bills.length; i++) {
        await autoUpdateMerchantBills(bills[i].date, [bills[i].merchant_id]);
    }
    console.log("Cleanup complete!");
}

run();
