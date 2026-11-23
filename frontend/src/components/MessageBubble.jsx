/**
 * components/MessageBubble.jsx - Individual chat message bubble for CONVO
 * Displays sender name, message body, and timestamp.
 * Sent messages are blue (right), received are white (left).
 */

export default function MessageBubble({ message, currentUserId }) {
  const isSent = message.sender_id == currentUserId;
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex ${
        isSent ? 'justify-end' : 'justify-start'
      } mb-3`}
    >
      <div
        className={`px-4 py-2 rounded-2xl max-w-[80%] break-words ${
          isSent
            ? 'chat-bubble-sent'
            : 'chat-bubble-received'
        }`}
      >
        {!isSent && (
          <div className="text-xs font-semibold text-blue-600 mb-1">
            {message.sender_username || 'You'}
          </div>
        )}
        <div className="text-sm">{message.body}</div>
        <div className="text-[10px] text-gray-400 mt-1 text-right">
          {time}
        </div>
      </div>
    </div>
  );
}
