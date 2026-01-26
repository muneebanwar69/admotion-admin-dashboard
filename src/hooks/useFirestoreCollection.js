import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Custom hook for real-time Firestore collection subscription
 * @param {string} collectionName - Name of the Firestore collection
 * @param {object} options - Query options
 * @returns {{ data: array, loading: boolean, error: Error | null }}
 */
export const useFirestoreCollection = (collectionName, options = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    orderByField = null,
    orderDirection = 'desc',
    limitCount = null,
    whereConditions = []
  } = options

  useEffect(() => {
    if (!collectionName) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let q = collection(db, collectionName)

      // Apply where conditions if provided
      if (whereConditions.length > 0) {
        // Note: This is simplified - you may need to import where from firebase/firestore
        // and build the query more carefully
        console.warn('Where conditions not fully implemented in useFirestoreCollection')
      }

      // Apply ordering if provided
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection))
      }

      // Apply limit if provided
      if (limitCount) {
        q = query(q, limit(limitCount))
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setData(items)
          setLoading(false)
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err)
          setError(err)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error(`Error setting up ${collectionName} listener:`, err)
      setError(err)
      setLoading(false)
    }
  }, [collectionName, orderByField, orderDirection, limitCount])

  return { data, loading, error }
}
