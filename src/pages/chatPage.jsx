import { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';

// Componente: Animación de "Pensando"
// Con  tailwindcss ajusto para mostrar tres puntos pequeños con animación cuando el modelo está procesando
const ThinkingAnimation = () => {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6b7280' }}>
        <Bot size={18} color="white" />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-transparent">
        <span className="text-sm font-medium text-gray-700">
          Pensando
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Componente: Mensaje del Chat
// Muestra cada mensaje de la conversación (usuario o modelo)
const ChatMessage = ({ message, isUser }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(!isUser);

  // Efecto para animar el texto palabra por palabra (solo para respuestas del modelo)
  useEffect(() => {
    // Verificación segura: si no hay contenido, salimos
    if (!message?.content) return;

    // Caso: mensaje del asistente (animación)
    if (!isUser) {
      setDisplayedText('');
      setIsAnimating(true);

      // Dividir en palabras, eliminando vacías o undefined
      const words = (message.content || '').split(' ').filter(Boolean);
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < words.length) {
          const nextWord = words[currentIndex];
          if (nextWord !== undefined) {
            setDisplayedText(prev =>
              prev + (currentIndex > 0 ? ' ' : '') + nextWord
            );
          }
          currentIndex++;
        } else {
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }

    // Caso: mensaje del usuario (sin animación)
    if (isUser) {
      setDisplayedText(message.content);
    }
  }, [message?.content, isUser]);

  // Mensaje del usuario
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div
          className="max-w-[70%] px-4 py-3 rounded-xl shadow-sm"
          style={{ backgroundColor: '#e8e8e8', color: '#000000' }}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {displayedText}
          </div>
        </div>
      </div>
    );
  }

  // Mensaje del asistente
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#6b7280' }}
      >
        <Bot size={18} color="white" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold mb-1 text-gray-600">
          Asistente IA
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
          {displayedText}
          {isAnimating && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
};


// Componente: Campo de entrada para escribir mensajes con selector de modelo
const ChatInput = ({ onSend, disabled, selectedModel, onModelChange }) => {
  const [input, setInput] = useState('');
  
// Si tenemos otros modelos en Ollama hacemos el cambio aqui
  const models = [
    { id: 'llama3.2', name: 'Llama 3.2 (3B)' },
    { id: 'gemma3:1b', name: 'Gemma 3 (1B)' },
    { id: 'qwen3:8b', name: 'Qwen 3 (8B)' },
    { id: 'llama3.2:1b', name: 'Llama 3.2 (1B)' }
  ];
  
  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="flex gap-3 items-center">
      {/* Selector de Modelo */}
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="flex-shrink-0 px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all text-sm font-medium"
        style={{ 
          borderColor: '#d1d5db',
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          color: '#374151',
          minWidth: '160px'
        }}
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>{model.name}</option>
        ))}
      </select>
      
      {/* Input de Mensaje */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Escribe tu pregunta aquí..."
        disabled={disabled}
        className="flex-1 px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
        style={{ 
          borderColor: '#d1d5db',
          backgroundColor: disabled ? '#f3f4f6' : 'white'
        }}
      />
      
      {/* Botón Enviar */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#6b7280' }}
      >
        Enviar
      </button>
    </div>
  );
};

// Componente Principal: Página del Chat
const ChatPage = () => {
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Función para hacer scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  // Función para enviar mensajes a Ollama
  const handleSendMessage = async (userMessage) => {
    // Agregar mensaje del usuario
    const userMsg = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    
    try {
      // Llamar a la API de Ollama (debe estar corriendo en localhost:11434)
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: userMessage,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al conectar con Ollama');
      }
      
      const data = await response.json();
      console.log('Respuesta de Ollama:', data);
      
      // Agregar respuesta del modelo
      const assistantMsg = {
        role: 'assistant',
        content: data.response,
        model: selectedModel
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = {
        role: 'assistant',
        content: '❌ No pude conectarme con Ollama. Asegúrate de que Ollama esté corriendo en tu computadora (ollama serve).',
        model: selectedModel
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Barra Superior */}
      <div className="shadow-sm" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">EduLlama</h1>
        </div>
      </div>
      
      {/* Contenedor Principal con márgenes blancos */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Área de Mensajes */}
          <div 
            className="mb-6 p-4 rounded-xl overflow-y-auto"
            style={{ 
              backgroundColor: '#fefefe',
              minHeight: '500px',
              maxHeight: '600px',
              border: '2px solid #e5e7eb'
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-400">
                ¿Qué preguntas tienes para hoy? 
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={index}
                    message={msg}
                    isUser={msg.role === 'user'}
                  />
                ))}
                {isLoading && <ThinkingAnimation />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Campo de Entrada con Selector */}
          <ChatInput 
            onSend={handleSendMessage}
            disabled={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
