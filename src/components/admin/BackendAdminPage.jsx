import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api/httpClient';
import { getCurrentUser } from '@/services/userService';
import styles from './BackendAdminPage.module.scss';

const sections = [
  ['products', 'Ürünler', 'products?pageSize=100'],
  ['categories', 'Kategoriler', 'categories/management'],
  ['tags', 'Etiketler', 'tags'],
  ['roles', 'Roller', 'roles'],
  ['permissions', 'Yetkiler', 'roles/permissions'],
  ['reports', 'Açık raporlar', 'product-reports/open?pageSize=100'],
  ['proposals', 'Bekleyen öneriler', 'product-edit-proposals/pending?pageSize=100'],
];

export default function BackendAdminPage({ onBack }) {
  const user = getCurrentUser();
  const allowed = ['admin', 'moderator'].includes(user?.role);
  const [section, setSection] = useState(sections[0]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setData(null);
    setError('');
    apiRequest(section[2]).then((result) => {
      if (!cancelled) setData(result);
    }).catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [section, allowed, version]);

  const rows = Array.isArray(data) ? data : data?.items || [];
  const columns = [...new Set(rows.flatMap(Object.keys))];
  return <main className={styles.page}>
    <header><button onClick={onBack}>← Guidora</button><h1>Yönetim</h1><span>Gerçek backend</span></header>
    {!allowed ? <p role="alert">Bu alan için yetkili bir hesapla giriş yapın.</p> : <>
      <nav aria-label="Yönetim bölümleri">{sections.map((item) => <button key={item[0]} aria-pressed={section[0] === item[0]} onClick={() => setSection(item)}>{item[1]}</button>)}</nav>
      <h2>{section[1]}</h2>
      <p>Veriler backend’den okunur. Bu görünüm salt okunurdur; demo düzenleme ve yedekleme işlemleri canlı veriler üzerinde sunulmaz.</p>
      <button onClick={() => setVersion((v) => v + 1)}>Yenile</button>
      {error ? <p role="alert">{error}</p> : data === null ? <p role="status">Yükleniyor…</p> : <>
        <p>{data?.totalCount ?? rows.length} kayıt</p>
        {rows.length === 0 ? <p>Henüz kayıt yok.</p> : <div className={styles.table}><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column] ?? '—')}</td>)}</tr>)}</tbody></table></div>}
      </>}
    </>}
  </main>;
}
