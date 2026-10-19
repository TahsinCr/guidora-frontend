import React, { useEffect, useState } from 'react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { apiRequest } from '@/services/api/httpClient';
import { addProductComment } from '@/services/api/productsApi';
import { getCurrentUser } from '@/services/userService';
import ReviewsTab from './ReviewsTab';
import styles from './DocContent.module.scss';

export default function BackendDocContent({ tool, activeTab, onReviewCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [refresh, setRefresh] = useState(0);
  const resources = { gallery: 'media', changelog: 'changelogs', reviews: 'comments' };
  const resource = resources[activeTab];
  useEffect(() => {
    let cancelled = false;
    setError('');
    setItems([]);
    if (!resource) return;
    setLoading(true);
    apiRequest(`products/${tool.numericId}/${resource}?pageSize=100`).then((result) => {
      if (cancelled) return;
      const rows = Array.isArray(result) ? result : result.items || [];
      setItems(rows);
      if (activeTab === 'reviews') onReviewCountChange?.(result.totalCount ?? rows.length);
    }).catch((err) => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tool.numericId, activeTab, refresh]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await addProductComment(tool.numericId, comment);
      setComment('');
      setRefresh((value) => value + 1);
    } catch (err) { setError(err.message); }
  }
  return <div className={styles.contentCard}>
    {activeTab === 'about' ? (
      <MarkdownRenderer content={tool.description || tool.tagline || ''} />
    ) : activeTab === 'reviews' ? (
      <ReviewsTab toolId={tool?.id} onReviewCountChange={onReviewCountChange} />
    ) : !resource ? (
      <p>Backend bu bilgiyi henüz sunmuyor.</p>
    ) : (
      <>
        {loading ? (
          <p role="status">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p>Henüz kayıt yok.</p>
        ) : (
          items.map((item, index) => (
            <article key={item.id || index}>
              <h3>{item.title || item.version || ''}</h3>
              <MarkdownRenderer content={item.content || item.description || item.summary || item.altText || ''} />
              {item.createdAt && <time>{new Date(item.createdAt).toLocaleDateString()}</time>}
            </article>
          ))
        )}
      </>
    )}
    {error && <p role="alert">{error}</p>}
  </div>;
}
