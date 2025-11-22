import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  where,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface FirestorePaginationOptions {
  collectionName: string
  orderByField?: string
  orderDirection?: 'asc' | 'desc'
  limitPerPage?: number
  whereConditions?: QueryConstraint[]
}

export interface FirestorePaginationState<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  currentPage: number
  totalLoadedItems: number
  lastVisible: DocumentSnapshot | null
  firstVisible: DocumentSnapshot | null
}

export interface FirestorePaginationActions {
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  refresh: () => void
  updateFilters: (whereConditions: QueryConstraint[]) => void
}

export function useFirestorePagination<T>(
  options: FirestorePaginationOptions
): FirestorePaginationState<T> & FirestorePaginationActions {
  const {
    collectionName,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limitPerPage = 10,
    whereConditions = []
  } = options

  const [state, setState] = useState<FirestorePaginationState<T>>({
    data: [],
    loading: true,
    error: null,
    hasNextPage: false,
    hasPreviousPage: false,
    currentPage: 1,
    totalLoadedItems: 0,
    lastVisible: null,
    firstVisible: null
  })

  // Store page cursors for navigation
  const [pageCursors, setPageCursors] = useState<Map<number, DocumentSnapshot>>(new Map())
  const [filters, setFilters] = useState<QueryConstraint[]>(whereConditions)

  const loadPage = async (
    pageNumber: number = 1, 
    startAfterDoc?: DocumentSnapshot,
    isRefresh: boolean = false
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Build query
      const constraints: QueryConstraint[] = [
        ...filters,
        orderBy(orderByField, orderDirection),
        limit(limitPerPage + 1) // Load one extra to check if there's a next page
      ]

      // Add cursor for pagination
      if (startAfterDoc && pageNumber > 1) {
        constraints.push(startAfter(startAfterDoc))
      }

      const q = query(collection(db, collectionName), ...constraints)
      const snapshot = await getDocs(q)
      const docs = snapshot.docs

      // Check if there are more pages
      const hasMore = docs.length > limitPerPage
      const actualData = hasMore ? docs.slice(0, limitPerPage) : docs

      // Transform data
      const data = actualData.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to dates if needed
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      })) as T[]

      // Update page cursors for navigation
      if (!isRefresh && actualData.length > 0) {
        const newCursors = new Map(pageCursors)
        if (pageNumber > 1) {
          newCursors.set(pageNumber, startAfterDoc!)
        }
        setPageCursors(newCursors)
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        hasNextPage: hasMore,
        hasPreviousPage: pageNumber > 1,
        currentPage: pageNumber,
        totalLoadedItems: data.length,
        lastVisible: actualData[actualData.length - 1] || null,
        firstVisible: actualData[0] || null
      }))

    } catch (error: any) {
      console.error('Firestore pagination error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error loading data',
        data: []
      }))
    }
  }

  // Initial load
  useEffect(() => {
    loadPage(1, undefined, false)
  }, [collectionName, orderByField, orderDirection, limitPerPage])

  // Reload when filters change
  useEffect(() => {
    setPageCursors(new Map())
    setState(prev => ({ ...prev, currentPage: 1 }))
    loadPage(1, undefined, true)
  }, [filters])

  const nextPage = () => {
    if (state.hasNextPage && state.lastVisible) {
      loadPage(state.currentPage + 1, state.lastVisible)
    }
  }

  const previousPage = () => {
    if (state.hasPreviousPage) {
      const prevPageCursor = pageCursors.get(state.currentPage - 1)
      loadPage(state.currentPage - 1, prevPageCursor)
    }
  }

  const goToPage = (page: number) => {
    if (page === state.currentPage) return
    if (page < 1) return

    if (page === 1) {
      loadPage(1)
    } else {
      const pageCursor = pageCursors.get(page)
      loadPage(page, pageCursor)
    }
  }

  const refresh = () => {
    setPageCursors(new Map())
    loadPage(state.currentPage, undefined, true)
  }

  const updateFilters = (newFilters: QueryConstraint[]) => {
    setFilters(newFilters)
  }

  return {
    ...state,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    updateFilters
  }
}