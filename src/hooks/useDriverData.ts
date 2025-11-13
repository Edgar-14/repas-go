import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { firestore, COLLECTIONS } from '../config/firebase';
import { Driver } from '../types';
import { RootState } from '../store';

export const useDriverData = () => {
  const authDriver = useSelector((state: RootState) => state.auth.driver);
  const [driverData, setDriverData] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!authDriver || !authDriver.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = firestore()
      .collection(COLLECTIONS.DRIVERS)
      .doc(authDriver.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setDriverData({ uid: doc.id, ...doc.data() } as Driver);
            setError(null);
          } else {
            setError(new Error('No se encontró el perfil del repartidor en la base de datos.'));
            setDriverData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error escuchando datos del repartidor:', err);
          setError(err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [authDriver?.uid]);

  return { driverData, loading, error };
};