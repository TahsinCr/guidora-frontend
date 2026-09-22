import React, { useState } from 'react';
import ToolStudioForm from '@/components/common/ToolStudioForm';
import { addTool } from '@/services/toolsService';

export default function SubmitToolPage({ onBack, onToolCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (toolPayload) => {
    setIsSubmitting(true);
    try {
      const newTool = await addTool(toolPayload);
      if (onToolCreated) {
        onToolCreated(newTool);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ToolStudioForm
      mode="create"
      isModal={false}
      onSave={handleSave}
      onCancel={onBack}
      isSubmitting={isSubmitting}
    />
  );
}
