'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { motion } from 'framer-motion'
import { 
  BarChart3, Table, ChevronLeft, TrendingUp, TrendingDown, Minus,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface CollectionHistory {
  id: string
  name: string
  contractAddress: string
  imageUrl: string | null
  color: string
  votes: (number | null)[]
}

interface HistoryData {
  months: string[]
  monthLabels: string[]
  collections: CollectionHistory[]
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [topFilter, setTopFilter] = useState(10)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [hiddenCollections, setHiddenCollections] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/history')
        if (res.ok) {
          const historyData = await res.json()
          setData(historyData)
          // Set selected month to latest
          if (historyData.months.length > 0) {
            setSelectedMonth(historyData.months[historyData.months.length - 1])
          }
        }
      } catch (error) {
        console.error('Failed to fetch history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const toggleCollection = (id: string) => {
    setHiddenCollections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getTableData = () => {
    if (!data || !selectedMonth) return []
    
    const monthIdx = data.months.indexOf(selectedMonth)
    const prevMonthIdx = monthIdx > 0 ? monthIdx - 1 : null

    return data.collections
      .map(col => ({
        ...col,
        currentVotes: col.votes[monthIdx] || 0,
        prevVotes: prevMonthIdx !== null ? col.votes[prevMonthIdx] : null
      }))
      .filter(col => col.currentVotes > 0)
      .sort((a, b) => b.currentVotes - a.currentVotes)
      .slice(0, 50)
  }

  const chartData = {
    labels: data?.monthLabels || [],
    datasets: (data?.collections || [])
      .slice(0, topFilter)
      .map(col => ({
        label: col.name,
        data: col.votes,
        borderColor: col.color,
        backgroundColor: col.color,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 10,
        borderWidth: 2,
        hidden: hiddenCollections.has(col.id)
      }))
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Total Votes',
          color: '#9ca3af'
        },
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(255,255,255,0.05)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month',
          color: '#9ca3af'
        },
        ticks: { color: '#6b7280' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: true
      }
    }
  }

  // Calculate stats
  const totalVotes = data?.collections.reduce((acc: number, col) => {
    const colVotes = col.votes || []
    return acc + colVotes.reduce((sum: number, v) => sum + (v || 0), 0)
  }, 0) || 0

  const uniqueCollections = data?.collections.filter(c => {
    const votes = c.votes || []
    return votes.some(v => v !== null)
  }).length || 0

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12">
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-movement-yellow" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-movement-gray-400 hover:text-white text-sm mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Vote
            </Link>
            <h1 className="text-3xl md:text-4xl font-display tracking-wider">
              <span className="text-white">VOTING</span>
              <span className="text-movement-yellow"> HISTORY</span>
            </h1>
            <p className="text-movement-gray-400 mt-2">Track collection performance over time</p>
          </div>

          {/* View Toggle & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex bg-movement-gray-900 rounded-lg p-1">
              <button
                onClick={() => setView('chart')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  view === 'chart' 
                    ? 'bg-movement-yellow text-movement-black' 
                    : 'text-movement-gray-400 hover:text-white hover:bg-movement-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Chart View
              </button>
              <button
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  view === 'table' 
                    ? 'bg-movement-yellow text-movement-black' 
                    : 'text-movement-gray-400 hover:text-white hover:bg-movement-gray-800'
                }`}
              >
                <Table className="w-4 h-4" />
                Table View
              </button>
            </div>

            {view === 'chart' && (
              <div className="flex items-center gap-3">
                <span className="text-movement-gray-400 text-sm">Show:</span>
                <select
                  value={topFilter}
                  onChange={(e) => setTopFilter(Number(e.target.value))}
                  className="bg-movement-gray-800 border border-movement-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={15}>Top 15</option>
                  <option value={25}>Top 25</option>
                  <option value={50}>Top 50</option>
                </select>
              </div>
            )}
          </div>

          {/* Chart View */}
          {view === 'chart' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1">Vote Trends Over Time</h2>
                <p className="text-movement-gray-400 text-sm">Click legend items to show/hide collections</p>
              </div>

              {/* Chart */}
              <div className="relative h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>

              {/* Custom Legend */}
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-movement-gray-800">
                <button
                  onClick={() => {
                    const visibleIds = (data?.collections || []).slice(0, topFilter).map(c => c.id)
                    const allHidden = visibleIds.every(id => hiddenCollections.has(id))
                    setHiddenCollections(allHidden ? new Set() : new Set(visibleIds))
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-movement-gray-400 hover:text-white hover:bg-movement-gray-800 transition-all border border-movement-gray-700"
                >
                  {(data?.collections || []).slice(0, topFilter).every(c => hiddenCollections.has(c.id)) ? 'Select All' : 'Deselect All'}
                </button>
                {data?.collections.slice(0, topFilter).map(col => (
                  <button
                    key={col.id}
                    onClick={() => toggleCollection(col.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      hiddenCollections.has(col.id) 
                        ? 'opacity-30' 
                        : 'hover:bg-movement-gray-800'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-sm text-movement-gray-300">{col.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Table View */}
          {view === 'table' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              {/* Month Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {data?.months.map((month, idx) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      selectedMonth === month
                        ? 'bg-movement-yellow/20 text-movement-yellow border border-movement-yellow/30'
                        : 'bg-movement-gray-800 text-movement-gray-400 border border-transparent hover:bg-movement-gray-700 hover:text-white'
                    }`}
                  >
                    {data.monthLabels[idx]}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-movement-gray-700">
                      <th className="text-left py-3 px-4 text-movement-gray-400 font-medium text-sm uppercase tracking-wider w-20">Rank</th>
                      <th className="text-left py-3 px-4 text-movement-gray-400 font-medium text-sm uppercase tracking-wider">Collection</th>
                      <th className="text-right py-3 px-4 text-movement-gray-400 font-medium text-sm uppercase tracking-wider">Votes</th>
                      <th className="text-right py-3 px-4 text-movement-gray-400 font-medium text-sm uppercase tracking-wider">vs Last Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTableData().map((col, idx) => {
                      const rank = idx + 1
                      const diff = col.prevVotes !== null ? col.currentVotes - col.prevVotes : null

                      return (
                        <tr 
                          key={col.id} 
                          className="border-b border-movement-gray-800 hover:bg-movement-yellow/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            {rank === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-movement-gray-400 font-bold">{rank}</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: col.color }}
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">{col.name}</div>
                                <div className="text-xs text-movement-gray-500 truncate">
                                  {col.contractAddress.slice(0, 6)}...{col.contractAddress.slice(-4)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-movement-yellow text-lg">
                              {col.currentVotes.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {diff !== null ? (
                              <div className={`inline-flex items-center gap-1 ${
                                diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-movement-gray-400'
                              }`}>
                                {diff > 0 ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : diff < 0 ? (
                                  <TrendingDown className="w-4 h-4" />
                                ) : (
                                  <Minus className="w-4 h-4" />
                                )}
                                <span className="font-medium">
                                  {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-movement-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="card p-4 text-center">
              <p className="text-movement-gray-400 text-sm">Total Months</p>
              <p className="text-2xl font-bold text-white">{data?.months.length || 0}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-movement-gray-400 text-sm">Collections Tracked</p>
              <p className="text-2xl font-bold text-white">{uniqueCollections}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-movement-gray-400 text-sm">Total Votes Cast</p>
              <p className="text-2xl font-bold text-movement-yellow">{totalVotes.toLocaleString()}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-movement-gray-400 text-sm">Data Since</p>
              <p className="text-2xl font-bold text-white">{data?.monthLabels[0] || '-'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}