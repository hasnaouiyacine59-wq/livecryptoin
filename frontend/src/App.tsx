import { useState } from 'react'
import Nav from './components/Nav'
import Ticker from './components/Ticker'
import Footer from './components/Footer'
import Modal from './components/Modal'
import HomePage from './pages/HomePage'
import ChartPage from './pages/ChartPage'
import TradesPage from './pages/TradesPage'
import TokenPage from './pages/TokenPage'
import SearchPage from './pages/SearchPage'
import SwapPage from './pages/SwapPage'
import PortfolioPage from './pages/PortfolioPage'
import ChainsPage from './pages/ChainsPage'

type Page = 'home' | 'chart' | 'trades' | 'token' | 'search' | 'swap' | 'portfolio' | 'chains'

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [modal, setModal] = useState<string | null>(null)
  const [tokenNav, setTokenNav] = useState<{ chain: string; addr: string } | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [chartNav, setChartNav] = useState<{ chain: string; pool: string } | null>(null)

  function openToken(chain: string, addr: string) {
    setTokenNav({ chain, addr })
    setPage('token')
  }

  function handleSearch(q: string) {
    setSearchQ(q)
    setPage('search')
  }

  function handleChainSelect(chain: string) {
    setChartNav({ chain, pool: 'BTCUSDT' })
    setPage('chart')
  }

  return (
    <>
      <Nav page={page} onNav={p => setPage(p as Page)} onSearch={handleSearch} />
      <Ticker />
      <main style={{ flex: 1, padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {page === 'home' && <HomePage onOpenToken={openToken} />}
        {page === 'chart' && <ChartPage key={JSON.stringify(chartNav)} initialChain={chartNav?.chain} initialPool={chartNav?.pool} />}
        {page === 'trades' && <TradesPage />}
        {page === 'token' && <TokenPage key={JSON.stringify(tokenNav)} onOpenToken={openToken} />}
        {page === 'search' && <SearchPage key={searchQ} initialQ={searchQ} onOpenToken={openToken} />}
        {page === 'swap' && <SwapPage />}
        {page === 'portfolio' && <PortfolioPage onOpenToken={openToken} />}
        {page === 'chains' && <ChainsPage onSelectChain={handleChainSelect} />}
      </main>
      <Footer onModal={setModal} onNav={p => setPage(p as Page)} />
      <Modal modalKey={modal} onClose={() => setModal(null)} />
    </>
  )
}
