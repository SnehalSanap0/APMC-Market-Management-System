import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const isApproved = userProfile?.status === 'approved' || isAdmin;
  
  const canRead = userProfile?.permissions?.read || isAdmin;
  const canWrite = userProfile?.permissions?.write || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        session,
        userProfile,
        loading,
        isAdmin,
        isApproved,
        canRead,
        canWrite,
        refreshProfile: () => session?.user?.id && fetchUserProfile(session.user.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
