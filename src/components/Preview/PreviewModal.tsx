"use client";
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  FileText 
} from 'lucide-react';
import useStore from '@/lib/store';

interface Message {
  id: string;
  type: 'bot' | 'user';
  contentType: 'text' | 'image' | 'video' | 'audio' | 'embed';
  content: string;
}

export default function PreviewModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { bots, activeBotId } = useStore();
  const activeBot = bots.find(b => b.id === activeBotId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen && activeBot && activeBot.nodes.length > 0) {
      // Find start node
      const startNode = activeBot.nodes.find(node => node.type === 'start') || activeBot.nodes[0];
      
      setMessages([]);
      setVariables({});
      
      // If start node has an edge, process the target of that edge
      const firstEdge = activeBot.edges.find(e => e.source === startNode.id);
      if (firstEdge) {
        processNode(firstEdge.target);
      }
    }
  }, [isOpen, activeBot]);

  const processNode = async (nodeId: string) => {
    const node = activeBot?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCurrentNodeId(nodeId);
    setIsTyping(true);

    // Process Bubbles
    const bubbles = node.data.bubbles || [];
    for (const bubble of bubbles) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        type: 'bot',
        contentType: bubble.type,
        content: bubble.content
      }]);
    }

    setIsTyping(false);

    // If node has no inputs and has a single outgoing edge, move to next
    const inputs = node.data.inputs || [];
    if (inputs.length === 0) {
      const edge = activeBot?.edges.find(e => e.source === nodeId && e.sourceHandle === 'main-source');
      if (edge) {
        processNode(edge.target);
      }
    }
  };

  const handleUserInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !currentNodeId) return;

    const node = activeBot?.nodes.find(n => n.id === currentNodeId);
    if (!node) return;

    const inputs = node.data.inputs || [];
    if (inputs.length === 0) return;

    // For now, we take the first pending input
    const currentInput = inputs[0]; 
    const inputVar = currentInput.variable || 'user_response';
    
    setVariables(prev => ({ ...prev, [inputVar]: userInput }));
    
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      contentType: 'text',
      content: userInput
    }]);

    setUserInput('');
    
    // Move to next node based on the specific handle of this input
    const edge = activeBot?.edges.find(e => e.source === currentNodeId && e.sourceHandle === `handle-${currentInput.id}`);
    if (edge) {
      processNode(edge.target);
    } else {
      // Fallback to main-source if no specific edge
      const fallbackEdge = activeBot?.edges.find(e => e.source === currentNodeId && e.sourceHandle === 'main-source');
      if (fallbackEdge) {
        processNode(fallbackEdge.target);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FAFAFA] w-full max-w-[400px] h-[650px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border-[8px] border-white relative mx-4">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Bot size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{activeBot?.name || 'Chatbot'}</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.type === 'user' 
                  ? 'bg-orange-500 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {msg.contentType === 'text' && <p className="text-sm leading-relaxed">{msg.content}</p>}
                {msg.contentType === 'image' && <div className="rounded-lg bg-slate-50 p-2 text-xs italic text-slate-400">Image: {msg.content || 'No image source'}</div>}
                {msg.contentType === 'video' && <div className="rounded-lg bg-slate-50 p-2 text-xs italic text-slate-400">Video: {msg.content || 'No video source'}</div>}
                {msg.contentType === 'audio' && <div className="rounded-lg bg-slate-50 p-2 text-xs italic text-slate-400">Audio: {msg.content || 'No audio source'}</div>}
                {msg.contentType === 'embed' && <div className="rounded-lg bg-slate-50 p-2 text-xs italic text-slate-400">Embed: {msg.content || 'No embed source'}</div>}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleUserInput} className="flex items-center gap-2">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={!userInput.trim()}
              className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-50 disabled:bg-slate-200"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
