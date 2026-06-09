import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import chatbotService from '../services/chatbotService';
import authService from '../services/authService';
import { useToast } from '../components/Toast';
import { 
  Send, 
  Bot, 
  User, 
  Languages, 
  UserCheck, 
  Trash2,
  Loader
} from 'lucide-react';

const Chatbot = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  
  // Chat stream list
  const [messages, setMessages] = useState([
    {
      id: 'greet-1',
      sender: 'bot',
      text: 'Hello! I am your Public Health Assistant. How can I help you today with your vaccinations or symptoms?',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en');
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [useGuest, setUseGuest] = useState(false);
  const [usersList, setUsersList] = useState([]);
  
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to the bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Fetch users list to query chatbot on behalf of patients (Admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await authService.getUsers(0, 100);
        setUsersList(data);
      } catch (error) {
        console.error("Failed to load users for chat context:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isAdmin]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Append user message to stream
    const userMsgId = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: userMessageText,
        timestamp: new Date()
      }
    ]);

    try {
      const chatUserId = isAdmin ? (useGuest ? null : selectedUserId) : user?.id;
      
      const response = await chatbotService.query({
        user_id: chatUserId,
        message: userMessageText,
        language: language,
        channel: 'web'
      });

      // Append bot response to stream
      setMessages((prev) => [
        ...prev,
        {
          id: response.message_id || Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: response.response_text,
          detectedLanguage: response.detected_language,
          timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
        }
      ]);
    } catch (error) {
      console.error("Chat query error:", error);
      const errorMsg = error.response?.data?.detail || "Failed to retrieve chatbot response. Please try again.";
      toast.error(errorMsg);
      
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'bot',
          text: "I'm sorry, I encountered an issue querying the message router. Please make sure the service is running.",
          isError: true,
          timestamp: new Date()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'greet-1',
        sender: 'bot',
        text: 'Hello! I am your AI Public Health Assistant. How can I help you today with your vaccinations or symptoms?',
        timestamp: new Date()
      }
    ]);
    toast.info("Chat history cleared.");
  };

  const suggestedQuestions = [
    "What is polio?",
    "What causes measles?",
    "I have fever",
    "What are vaccine side effects?",
    "When should a child receive the polio vaccine?"
  ];

  const handleSuggestedQuestionClick = async (question) => {
    if (sending) return;
    setInputText('');
    setSending(true);

    // Append user message
    const userMsgId = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: question,
        timestamp: new Date()
      }
    ]);

    try {
      const chatUserId = isAdmin ? (useGuest ? null : selectedUserId) : user?.id;
      const response = await chatbotService.query({
        user_id: chatUserId,
        message: question,
        language: language,
        channel: 'web'
      });

      // Append bot response
      setMessages((prev) => [
        ...prev,
        {
          id: response.message_id || Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: response.response_text,
          detectedLanguage: response.detected_language,
          timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
        }
      ]);
    } catch (error) {
      console.error("Chat query error:", error);
      const errorMsg = error.response?.data?.detail || "Failed to retrieve response.";
      toast.error(errorMsg);
      
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'bot',
          text: "I encountered an issue. Please verify backend services are up.",
          isError: true,
          timestamp: new Date()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] lg:h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* Left panel: Context configuration */}
      <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 p-5 rounded-3xl flex flex-col gap-5 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isAdmin ? 'Interactive Sandbox' : 'AI Assistant'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">
            {isAdmin ? 'Test NLP queries and language routing' : 'Get instant answers about vaccine schedules'}
          </p>
        </div>

        {/* Language preference */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-green-600" />
            ISO Language Code
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-green-600 transition-colors text-xs font-semibold"
          >
            <option value="en">English (en)</option>
            <option value="hi">Hindi (hi)</option>
            <option value="te">Telugu (te)</option>
          </select>
        </div>

        {/* Patient query context (Admin only) */}
        {isAdmin && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-green-600" />
                Patient Context
              </label>
              <button
                onClick={() => setUseGuest(!useGuest)}
                className="text-[10px] text-green-600 font-bold hover:text-green-700"
              >
                {useGuest ? 'Select Registered' : 'Anonymous Guest'}
              </button>
            </div>

            {!useGuest ? (
              <div className="space-y-2">
                {loadingUsers ? (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Loading patient database...
                  </div>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-green-600 transition-colors text-xs font-semibold"
                  >
                    <option value={user?.id || ''}>Administrator ({user?.name || 'Self'})</option>
                    {usersList.map((u) => (
                      u.id !== user?.id && (
                        <option key={u.id} value={u.id}>
                          {u.name || 'Unnamed'} ({u.phone_number || 'No Phone'})
                        </option>
                      )
                    ))}
                  </select>
                )}
                <p className="text-[9px] text-slate-450 italic font-medium">
                  Simulates NLP checking schedule metrics for this patient registry UUID.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] italic font-semibold">
                Running in Guest mode. The backend will automatically provision a temporary guest row in the database.
              </div>
            )}
          </div>
        )}

        <button
          onClick={clearChat}
          className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-600 transition-all text-xs font-bold text-slate-700 shadow-sm bg-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Chat Stream
        </button>
      </div>

      {/* Right panel: Chat stream interface */}
      <div className="flex-1 min-h-[450px] lg:min-h-0 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
        {/* Chat Header: AI Public Health Assistant */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">AI Public Health Assistant</h4>
            <span className="text-[10px] text-green-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping"></span>
              Virtual Support Active
            </span>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
          
          {/* Empty-state Onboarding Panel */}
          {messages.length <= 1 && (
            <div className="max-w-md mx-auto py-8 text-center space-y-4 animate-fade-in bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-slate-900">Get Instant Public Health Answers</h5>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Select a suggested health query below or type your symptom in the chat input.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestedQuestionClick(q)}
                    className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-green-300 bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 text-xs font-bold transition-all card-hover"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            // Hide the default first message if user has started conversation to keep it clean, 
            // or render it normally. Let's render it normally as the greeting.
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center border text-xs font-bold ${
                  isBot 
                    ? 'bg-slate-100 border-slate-200 text-green-700' 
                    : 'bg-green-100 border-green-200 text-green-800'
                }`}>
                  {isBot ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                    isBot
                      ? msg.isError
                        ? 'bg-rose-50 border border-rose-100 text-rose-600'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                      : 'bg-green-600 text-white shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Footer metadata */}
                  <div className={`flex items-center gap-2 px-1 text-[9px] text-slate-400 font-bold ${isBot ? '' : 'justify-end'}`}>
                    <span>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.detectedLanguage && (
                      <span className="bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-mono uppercase text-[8px]">
                        Lang: {msg.detectedLanguage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing loader */}
          {sending && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center border bg-slate-100 border-slate-200 text-green-700">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested horizontal pills shown during chat activity */}
        {messages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-6 py-2 bg-slate-50/50 border-t border-slate-200">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSuggestedQuestionClick(q)}
                className="shrink-0 px-3 py-1.5 text-[10px] font-bold text-slate-650 bg-white hover:bg-green-50 hover:text-green-700 border border-slate-200 hover:border-green-300 rounded-full transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            required
            disabled={sending}
            placeholder={sending ? "Bot is thinking..." : `Ask about vaccine parameters or symptoms...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-xs font-semibold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default Chatbot;
