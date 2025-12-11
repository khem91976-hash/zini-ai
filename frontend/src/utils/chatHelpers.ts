import { jsPDF } from 'jspdf';
import { Message } from '../types';

/**
 * Exports the Zini chat history to a file.
 * @param ziniMessages The array of chat messages.
 * @param type The format to export ('pdf' or 'txt').
 */
export const exportZiniChat = (ziniMessages: Message[], type: 'pdf' | 'txt') => {
    const content = ziniMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    
    if (type === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zini-chat-${Date.now()}.txt`;
      a.click();
    } else {
      const doc = new jsPDF();
      // Basic text splitting for PDF - can be enhanced
      const splitText = doc.splitTextToSize(content, 180);
      let y = 10;
      // Simple pagination loop
      for(let i = 0; i < splitText.length; i++) {
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
        doc.text(splitText[i], 10, y);
        y += 7;
      }
      doc.save(`zini-chat-${Date.now()}.pdf`);
    }
};