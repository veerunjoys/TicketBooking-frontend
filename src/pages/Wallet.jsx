import React, { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import API from '../api';
import { PlusCircle, Landmark, AlertCircle, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import ActionLoader from '../components/ActionLoader';
import ProcessingOverlay from '../components/ProcessingOverlay';
import { TransactionTableSkeleton } from '../components/Skeleton';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const walletSteps = ['Validating amount', 'Crediting wallet', 'Updating ledger'];

const Wallet = () => {
  const { balance, topup } = useContext(WalletContext);
  
  const [topupAmount, setTopupAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [txPagination, setTxPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateIdempotencyKey = () => {
    const key = `topup-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    setIdempotencyKey(key);
  };

  const fetchTransactions = async (page = 1) => {
    try {
      setLoadingTransactions(true);
      const response = await API.get(`/wallet/transactions?page=${page}&limit=20`);
      setTransactions(response.data.data ?? response.data);
      if (response.data.pagination) setTxPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to load transaction ledger:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    generateIdempotencyKey();
    fetchTransactions();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amountInINR = parseFloat(topupAmount);
    if (isNaN(amountInINR) || amountInINR <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    // Convert to paise (integer)
    const amountInPaise = Math.round(amountInINR * 100);

    setSubmitting(true);
    setProcessing({
      title: 'Adding Funds',
      message: 'Validating your wallet top-up request.',
      activeStep: 0,
      done: false,
    });

    await wait(350);
    setProcessing({
      title: 'Adding Funds',
      message: 'Crediting funds to your wallet safely.',
      activeStep: 1,
      done: false,
    });

    const result = await topup(amountInPaise, idempotencyKey);

    if (result.success) {
      setProcessing({
        title: 'Wallet Updated',
        message: 'Refreshing your transaction ledger.',
        activeStep: 2,
        done: true,
      });
      setSuccess(`Successfully credited ₹${amountInINR.toFixed(2)} to your wallet.`);
      setTopupAmount('');
      // Generate new key for subsequent top-ups
      generateIdempotencyKey();
      // Reload transaction history
      await fetchTransactions();
      await wait(650);
    } else {
      setError(result.message);
    }
    setProcessing(null);
    setSubmitting(false);
  };

  const formatCurrency = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getTxRowStyle = (type) => {
    if (type === 'CREDIT' || type === 'REFUND') return { color: '#34d399' };
    return { color: '#f87171' };
  };

  return (
    <div className="fade-in" style={{ padding: '0 1.5rem', paddingBottom: '4rem' }}>
      <ProcessingOverlay
        open={Boolean(processing)}
        title={processing?.title}
        message={processing?.message}
        steps={walletSteps}
        activeStep={processing?.activeStep || 0}
        done={processing?.done}
      />

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          My Digital Wallet
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Top up funds instantly and view your transaction ledger log.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Left: Card & Top up Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Card */}
          <div className="glass-panel" style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(127, 0, 255, 0.4) 0%, rgba(0, 242, 254, 0.4) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            boxShadow: 'var(--shadow-glow)',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Landmark size={150} style={{
              position: 'absolute',
              right: '-30px',
              bottom: '-30px',
              opacity: 0.08,
              strokeWidth: 1
            }} />
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.75 }}>
              Available Balance
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {formatCurrency(balance)}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '2.5rem', opacity: 0.6 }}>
              TicketGlow Premium Digital Card
            </div>
          </div>

          {/* Top up Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Add Funds</h3>

            {success && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleTopup}>
              <div className="form-group">
                <label className="form-label">Amount (INR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="500.00"
                    style={{ paddingLeft: '2rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
                🔑 Lock Key: <span style={{ fontFamily: 'monospace' }}>{idempotencyKey.substring(0, 20)}...</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem' }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActionLoader label="Crediting funds..." />
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Top Up Wallet
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Ledger Logs */}
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction Ledger Log</h3>

          {loadingTransactions ? (
            <TransactionTableSkeleton />
          ) : transactions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', paddingTop: '4rem' }}>
              No transactions recorded in ledger.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 0.5rem' }}>Date</th>
                    <th style={{ padding: '0.85rem 0.5rem' }}>Type</th>
                    <th style={{ padding: '0.85rem 0.5rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem 0.5rem' }}>Ref</th>
                    <th style={{ padding: '0.85rem 0.5rem' }}>Bal After</th>
                    <th style={{ padding: '0.85rem 0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 700, ...getTxRowStyle(tx.type) }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {tx.type === 'CREDIT' || tx.type === 'REFUND' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {tx.type}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tx.referenceType}</td>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{formatCurrency(tx.balanceAfter)}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{
                          color: tx.status === 'SUCCESS' ? '#34d399' : '#f87171',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Transaction Pagination */}
          {txPagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn-secondary"
                disabled={txPagination.page <= 1}
                onClick={() => fetchTransactions(txPagination.page - 1)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                ← Previous
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Page <strong style={{ color: '#fff' }}>{txPagination.page}</strong> of <strong style={{ color: '#fff' }}>{txPagination.pages}</strong>
                <span style={{ marginLeft: '0.75rem', opacity: 0.6 }}>({txPagination.total} total)</span>
              </span>
              <button
                className="btn btn-secondary"
                disabled={txPagination.page >= txPagination.pages}
                onClick={() => fetchTransactions(txPagination.page + 1)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
