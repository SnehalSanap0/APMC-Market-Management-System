import { supabase } from './supabaseClient';

/**
 * Recalculates and updates merchant_bills + dhada_entries for the given merchants on a date.
 * Accounts for both hishob_items totals AND vatap (distribution) adjustments.
 *
 * @param {string} billDate - ISO date string (YYYY-MM-DD)
 * @param {string[]} merchantIds - Array of merchant UUIDs to update
 */
export async function autoUpdateMerchantBills(billDate, merchantIds) {
    const uniqueMerchants = [...new Set(merchantIds.filter(Boolean))];

    for (const merchantId of uniqueMerchants) {
        // 1. Sum all hishob_items for this merchant on this date
        const { data: allItems } = await supabase
            .from('hishob_items')
            .select(`amount, hishob_entries!inner(date)`)
            .eq('merchant_id', merchantId)
            .eq('hishob_entries.date', billDate);

        const hishobTotal = (allItems || []).reduce(
            (sum, item) => sum + (parseFloat(item.amount) || 0),
            0
        );

        // 2. Fetch vatap adjustments for this merchant on this date
        const [{ data: vatapGiven }, { data: vatapReceived }] = await Promise.all([
            supabase
                .from('vatap_entries')
                .select('amount')
                .eq('from_merchant_id', merchantId)
                .eq('date', billDate),
            supabase
                .from('vatap_entries')
                .select('amount')
                .eq('to_merchant_id', merchantId)
                .eq('date', billDate),
        ]);

        const vatapGivenTotal = (vatapGiven || []).reduce(
            (sum, v) => sum + (parseFloat(v.amount) || 0),
            0
        );
        const vatapReceivedTotal = (vatapReceived || []).reduce(
            (sum, v) => sum + (parseFloat(v.amount) || 0),
            0
        );

        // 3. Adjusted gross = hishob base ± vatap transfers
        const mGrossTotal = hishobTotal + vatapReceivedTotal - vatapGivenTotal;

        // Fetch existing bill if any
        const { data: existingBill } = await supabase
            .from('merchant_bills')
            .select('id')
            .eq('date', billDate)
            .eq('merchant_id', merchantId)
            .maybeSingle();

        // If there's absolutely no activity left, delete any orphaned bills & skip
        if (hishobTotal === 0 && vatapGivenTotal === 0 && vatapReceivedTotal === 0) {
            if (existingBill) {
                // Manually delete dhada entries incase cascade is off
                await supabase.from('dhada_entries').delete().eq('bill_id', existingBill.id);
                // Delete bill
                await supabase.from('merchant_bills').delete().eq('id', existingBill.id);
            }
            continue;
        }

        const mFees = {
            marketFee: mGrossTotal * 0.06,
            supervision: mGrossTotal * 0.01,
            donation: mGrossTotal * 0.0005,
            commission: 1, // flat ₹1
        };
        const mTotalCharges =
            mFees.marketFee + mFees.supervision + mFees.donation + mFees.commission;
        const mNetAmount = mGrossTotal + mTotalCharges;

        if (existingBill) {
            // Update existing bill and dhada entry
            await supabase
                .from('merchant_bills')
                .update({
                    gross_total: mGrossTotal,
                    market_fee: mFees.marketFee,
                    supervision_fee: mFees.supervision,
                    donation: mFees.donation,
                    commission: mFees.commission,
                    total_charges: mTotalCharges,
                    net_amount: mNetAmount,
                })
                .eq('id', existingBill.id);

            await supabase
                .from('dhada_entries')
                .update({
                    market_fee: mFees.marketFee,
                    supervision_fee: mFees.supervision,
                    donation: mFees.donation,
                    commission: mFees.commission,
                    total_income: mTotalCharges,
                })
                .eq('bill_id', existingBill.id);
        } else {
            // Create a new bill if the merchant has any activity (hishob OR vatap)
            // vatapGivenTotal/vatapReceivedTotal already passed the skip check above (line 53)

            const { count: mbCount } = await supabase
                .from('merchant_bills')
                .select('*', { count: 'exact', head: true })
                .eq('date', billDate);

            const mbSeq = ((mbCount ?? 0) + 1).toString().padStart(3, '0');
            const newBillNo = `MB-${billDate.replace(/-/g, '')}-${mbSeq}`;

            const { data: newBill } = await supabase
                .from('merchant_bills')
                .insert([
                    {
                        date: billDate,
                        merchant_id: merchantId,
                        bill_no: newBillNo,
                        gross_total: mGrossTotal,
                        market_fee: mFees.marketFee,
                        supervision_fee: mFees.supervision,
                        donation: mFees.donation,
                        commission: mFees.commission,
                        total_charges: mTotalCharges,
                        net_amount: mNetAmount,
                    },
                ])
                .select()
                .single();

            if (newBill) {
                await supabase.from('dhada_entries').insert([
                    {
                        date: billDate,
                        merchant_id: merchantId,
                        bill_id: newBill.id,
                        market_fee: mFees.marketFee,
                        supervision_fee: mFees.supervision,
                        donation: mFees.donation,
                        commission: mFees.commission,
                        total_income: mTotalCharges,
                    },
                ]);
            }
        }
    }
}
