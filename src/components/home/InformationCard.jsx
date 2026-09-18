import React from 'react';
import { Circle, Terminal, Image as ImageIcon, MessageSquare, Video, Sparkles } from 'lucide-react';
import styles from './InformationCard.module.scss';

const PILLS = [
  { id: 'generative-art', name: 'Generative Art', icon: Circle, color: '#A855F7', border: 'rgba(168, 85, 247, 0.45)' },
  { id: 'developer-tools', name: 'Coding Assistants', icon: Terminal, color: '#10B981', border: 'rgba(16, 185, 129, 0.45)' },
  { id: 'design-ui', name: 'Image Generation', icon: ImageIcon, color: '#06B6D4', border: 'rgba(6, 182, 212, 0.45)' },
  { id: 'llms-ai', name: 'Chatbots', icon: MessageSquare, color: '#EAB308', border: 'rgba(234, 179, 8, 0.45)' },
  { id: 'video-motion', name: 'Video Generation', icon: Video, color: '#EC4899', border: 'rgba(236, 72, 153, 0.45)' },
];

export default function InformationCard({ selectedCategory, onSelectCategory }) {
  return (
    <section className={styles.heroContainer}>
      <h1 className={styles.title}>
        Discover the <span className={styles.accent}>Perfect Tool</span> for Any Task
      </h1>
      <p className={styles.description}>
        The most advanced directory with deep filtering, real-time community verification, and bot-assisted updates.
      </p>

      <nav className={styles.pillsNav} aria-label="Category Filters">
        {PILLS.map((pill) => {
          const Icon = pill.icon;
          const isActive = selectedCategory === pill.id;

          return (
            <button
              key={pill.id}
              className={`${styles.categoryPill} ${isActive ? styles.active : ''}`}
              style={{
                '--pill-color': pill.color,
                '--pill-border': pill.border,
              }}
              onClick={() => onSelectCategory(isActive ? 'all' : pill.id)}
            >
              <Icon size={14} color={pill.color} />
              <span>{pill.name}</span>
            </button>
          );
        })}
      </nav>
    </section>
  );
}
