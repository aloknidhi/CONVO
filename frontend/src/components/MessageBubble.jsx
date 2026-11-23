// components/MessageBubble.jsx - Individual chat message for CONVO
// Displays sender info, message body, and timestamp.
// Sent messages (by current user) are blue/right-aligned; received are gray/left.

export default function MessageBubble({ message, currentUserId }) {
  const isSent = message.sender_id == currentUserId;
  const senderName = message.sender_username || 'Unknown';
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isSent ? 'flex-row-reverse' : ''} mb-2`}>
      <div className="flex flex-col">
        <div className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
          {message.body}
        </div>
        <div className="chat-bubble-meta">
          {isSent ? 'You' : senderName} &bull; {time}
        </div>
      </div>
    </div>
  );
}
