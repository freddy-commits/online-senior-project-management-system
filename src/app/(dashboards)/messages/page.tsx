'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  MessageSquare,
  Loader2,
  ChevronRight
} from 'lucide-react'

export default function MessagesPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

      // Fetch potential contacts (other users)
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20)
      
      setContacts(allUsers || [])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedContact || !userProfile) return

    fetchMessages()

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat-${selectedContact.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          if (
            (msg.sender_id === userProfile.id && msg.receiver_id === selectedContact.id) ||
            (msg.sender_id === selectedContact.id && msg.receiver_id === userProfile.id)
          ) {
            setMessages(prev => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedContact, userProfile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${userProfile.id})`)
      .order('created_at', { ascending: true })
    
    setMessages(data || [])
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedContact) return

    const msgContent = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: selectedContact.id,
      content: msgContent
    })

    if (error) {
      alert(error.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  return (
    <DashboardLayout role={userProfile.role} userName={userProfile.full_name}>
      <div className="h-[calc(100vh-160px)] flex bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
        
        {/* Contacts Sidebar */}
        <div className="w-80 border-r border-white/10 flex flex-col hidden md:flex">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                placeholder="Search people..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {contacts.map((contact) => (
              <button 
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all border-b border-white/5 ${
                  selectedContact?.id === contact.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center font-bold text-blue-400 shrink-0">
                  {contact.full_name[0]}
                </div>
                <div className="text-left overflow-hidden">
                  <div className="font-bold text-sm text-white truncate">{contact.full_name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{contact.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col relative">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-slate-950/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                    {selectedContact.full_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedContact.full_name}</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === userProfile.id
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                        isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20' 
                        : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-2 font-bold opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 bg-slate-950/40 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <button 
                    type="submit"
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all active:scale-[0.9] shrink-0"
                  >
                    <Send className="w-6 h-6 text-white" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Select a Conversation</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                Pick a contact from the list to start messaging with your team, instructor, or industry partner.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
