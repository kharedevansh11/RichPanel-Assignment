import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaInbox, FaUserCircle, FaRegUserCircle } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { BsGraphUpArrow } from "react-icons/bs";
import logo from '../assets/logo_richpanel.png';
import { TbReload } from "react-icons/tb";
import { RiMenu2Line } from "react-icons/ri";
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { IoMdCall } from "react-icons/io";
import { CgProfile } from "react-icons/cg";

const Dashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const token = localStorage.getItem('token');
  const { user } = useAuth();
  const { socket } = useSocket();

  // Socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('newMessage', ({ conversationId, message }) => {
      if (selectedConversation?._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      // Refresh conversations to update last message
      fetchConversations();
    });

    // Listen for conversation updates
    socket.on('conversationUpdate', ({ conversationId, lastMessageAt, senderName, senderPicture }) => {
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, lastMessageAt, senderName, senderPicture }
          : conv
      ));
    });

    return () => {
      socket.off('newMessage');
      socket.off('conversationUpdate');
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await axios.get('/api/facebook/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);

      if (res.data.length > 0 && !selectedConversation) {
        const previouslySelected = res.data.find(conv => conv._id === selectedConversation?._id);
        setSelectedConversation(previouslySelected || res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (token) fetchConversations();
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      setLoadingMessages(true);
      try {
        const res = await axios.get(`/api/facebook/conversations/${selectedConversation._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, token]);

  // Handle sending reply message
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || !token) return;

    try {
      const res = await axios.post('/api/facebook/messages', {
        conversationId: selectedConversation._id,
        text: replyText.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });


      setMessages([...messages, res.data.sentMessage]);
      setReplyText('');


      fetchConversations();

    } catch (err) {
      console.error('Error sending message:', err);

    }
  };

  // Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendReply();
    }
  };


  return (
    <div className="flex h-screen bg-gray-100">


      <div className="w-16 bg-[#004E96] text-white flex flex-col items-center py-4 justify-between">
        <div>

          <div className="mb-6">

            <img src={logo} alt="Logo" className="w-10 h-10" />
          </div>

          <div className="space-y-6">

            <div className="p-2 bg-white rounded-md text-[#004E96]">
              <FaInbox size={30} />
            </div>

            <div className="p-2 hover:bg-[#004E96] rounded-md cursor-pointer">
              <FaUserGroup size={30} />
            </div>

            <div className="p-2 hover:bg-[#004E96] rounded-md cursor-pointer">
              <BsGraphUpArrow size={30} />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <FaRegUserCircle size={30} />
        </div>
      </div>


      <div className="w-80 bg-white border-r flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <RiMenu2Line size={20} />
          <h2 className="text-xl font-semibold">Conversations</h2>

          <button onClick={fetchConversations} className="p-1 rounded-full hover:bg-gray-200">
            <TbReload size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet.</div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation._id}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${selectedConversation?._id === conversation._id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-center mb-1">

                  {conversation.senderPicture && (
                    <img src={conversation.senderPicture} alt="" className="w-10 h-10 rounded-full mr-3 object-cover" />
                  )}
                  {!conversation.senderPicture && (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3 text-lg">?</div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{conversation.senderName || 'Unknown Sender'}</h3>

                    <p className="text-sm text-gray-600 truncate">{conversation.messages && conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].text : 'No messages'}</p>
                  </div>

                  {conversation.lastMessageAt && (
                    <span className="text-xs text-gray-500">{moment(conversation.lastMessageAt).fromNow()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-white">

          <h2 className="text-xl font-semibold">{selectedConversation ? selectedConversation.senderName || 'Unknown Sender' : 'Select a Conversation'}</h2>

        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {!selectedConversation ? (
            <div className="text-center text-gray-500 mt-10">Select a conversation to view messages.</div>
          ) : loadingMessages ? (
            <div className="text-center">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">No messages in this conversation.</div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex items-start ${message.isEcho ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isEcho && (

                  selectedConversation?.senderPicture ? (
                    <img src={selectedConversation.senderPicture} alt="Customer" className="w-8 h-8 rounded-full mr-2 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-600 mr-2 text-sm">?</div>
                  )
                )}

                <div className={`flex flex-col ${message.isEcho ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg bg-white text-black shadow`}
                  >
                    <p>{message.text}</p>
                  </div>

                  <div className={`text-xs mt-1 text-gray-600 ${message.isEcho ? 'text-right' : 'text-left'}`}>
                    <span className="font-semibold mr-1">
                      {message.isEcho ? user?.name || 'You' : selectedConversation?.senderName || 'Unknown'} -
                    </span>
                    <span className="opacity-75">{moment(message.timestamp).format('MMM D, h:mm A')}</span>
                  </div>
                </div>

                {message.isEcho && (

                  <FaUserCircle size={32} className="ml-2 text-blue-800" />
                )}
              </div>
            ))
          )}
        </div>

        {selectedConversation && (
          <div className="border-t p-4 bg-white flex">
            <input
              type="text"
              placeholder={`Message ${selectedConversation.senderName || 'customer'}`}
              className="input flex-1 mr-2"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        )}
      </div>


      <div className="w-80 bg-white border-l flex flex-col">
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Customer Details</h3>
        </div>
        <div className="p-4 flex flex-col items-center">

          {!selectedConversation ? (
            <div className="text-center text-gray-500">Select a conversation to see details.</div>
          ) : (
            <>
              {selectedConversation.senderPicture && (
                <img src={selectedConversation.senderPicture} alt="Customer" className="mx-auto mb-4 rounded-full w-24 h-24 object-cover" />
              )}
              {!selectedConversation.senderPicture && (
                <div className="mx-auto mb-4 rounded-full w-24 h-24 bg-gray-300 flex items-center justify-center text-gray-600 text-3xl">?</div>
              )}


              <div className="text-center mb-4">
                <h4 className="font-semibold text-xl">{selectedConversation.senderName || 'Unknown Sender'}</h4>
                <p className="text-sm text-gray-600">Online</p>
              </div>


              <div className="flex space-x-2 mb-6 ">
                <button className="btn btn-outline border rounded-lg p-2 flex items-center space-x-2">
                  <IoMdCall />
                  <p>Call</p>
                </button>
                <button className="btn btn-outline border rounded-lg p-2 flex items-center space-x-2">

                  <CgProfile />
                  Profile
                </button>
              </div>


              <div className="w-full border rounded-lg p-4">
                <h5 className="font-semibold mb-3">Customer details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Email</span>

                    <span className="text-gray-700">amit@richpanel.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Name</span>

                    <span className="text-gray-700">{selectedConversation?.senderName?.split(' ')[0] || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Name</span>

                    <span className="text-gray-700">{selectedConversation?.senderName?.split(' ').slice(1).join(' ') || 'N/A'}</span>
                  </div>
                </div>

                <button className="text-sm text-blue-600 hover:underline mt-4">View more details</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
