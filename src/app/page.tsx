'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Download,
  Copy,
  Check,
  AlertCircle,
  Settings as SettingsIcon,
  Lock,
  Database,
  RefreshCw,
  FileText,
  Upload,
  Trash2,
} from 'lucide-react';
import { STYLES_PRESETS } from '@/lib/styles';
import { generateMockPostsForMonth } from '@/lib/mock-data';
import {
  ACCEPTED_CUSTOM_IMAGE_TYPES,
  BackgroundSource,
  DeliveryFormat,
  getActiveBackgroundUrl,
  hasCustomBackground,
  normalizePost,
  Post,
} from '@/lib/posts';
import { CanvasPost } from '@/components/canvas-post';
import { supabase } from '@/lib/supabase';
import { Toaster, toast } from 'sonner';

export default function Home() {
  // Estados de Data
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 4)); // Junho 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Estados de Configurações
  const [niche, setNiche] = useState<string>('Desenvolvimento Pessoal');
  const [stylePreset, setStylePreset] = useState<string>('minimalist');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Estados de Dados
  const [posts, setPosts] = useState<Record<string, Post>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings'>('calendar');

  // Estados de Edição do Post Selecionado
  const [editingQuote, setQuote] = useState<string>('');
  const [editingCaption, setCaption] = useState<string>('');
  const [editingStatus, setStatus] = useState<'draft' | 'ready' | 'published'>('ready');
  const [fontSize, setFontSize] = useState<number>(48);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');
  const [editingDeliveryFormat, setEditingDeliveryFormat] =
    useState<DeliveryFormat>('feed');
  const [editingActiveBackgroundSource, setEditingActiveBackgroundSource] =
    useState<BackgroundSource>('ai');
  const [isUploadingCustom, setIsUploadingCustom] = useState<boolean>(false);
  const customPhotoInputRef = React.useRef<HTMLInputElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    // 1. Verificar conexão com Supabase
    checkSupabaseConnection();

    // 2. Carregar configurações salvas no localStorage (se houver)
    const savedNiche = localStorage.getItem('inspirai_niche');
    const savedStyle = localStorage.getItem('inspirai_style');
    const savedPassword = localStorage.getItem('inspirai_password');

    if (savedNiche) setNiche(savedNiche);
    if (savedStyle) setStylePreset(savedStyle);
    if (savedPassword) setAdminPassword(savedPassword);

    // 3. Carregar posts
    loadPosts();
  }, [currentDate]);

  // Salvar configurações locais ao alterar
  useEffect(() => {
    localStorage.setItem('inspirai_niche', niche);
    localStorage.setItem('inspirai_style', stylePreset);
    localStorage.setItem('inspirai_password', adminPassword);
  }, [niche, stylePreset, adminPassword]);

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('id').limit(1);
      if (!error) {
        setIsSupabaseConnected(true);
      } else {
        setIsSupabaseConnected(false);
      }
    } catch (e) {
      setIsSupabaseConnected(false);
    }
  };

  const loadPosts = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Gerar data de início e fim do mês para busca
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      new Date(year, month + 1, 0).getDate()
    ).padStart(2, '0')}`;

    try {
      // Tentar buscar do Supabase
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .gte('post_date', startDate)
        .lte('post_date', endDate);

      if (!error && data && data.length > 0) {
        const postsMap: Record<string, Post> = {};
        data.forEach((row: Record<string, unknown>) => {
          const post = normalizePost(row);
          postsMap[post.post_date] = post;
        });
        setPosts(postsMap);
      } else {
        // Fallback para Mock Data se não houver registros ou se o Supabase não estiver configurado
        console.log('[Dashboard] Carregando posts de demonstração...');
        const mockPosts = generateMockPostsForMonth(year, month);
        setPosts(mockPosts);
      }
    } catch (e) {
      // Fallback em caso de erro
      const mockPosts = generateMockPostsForMonth(year, month);
      setPosts(mockPosts);
    }
  };

  // Navegação do Calendário
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Funções Auxiliares do Calendário
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Preencher dias vazios do mês anterior
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Preencher dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Formatar data para YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Abrir Modal de Detalhes do Post
  const handleDayClick = (date: Date) => {
    const dateStr = formatDateString(date);
    setSelectedDateStr(dateStr);

    const existingPost = posts[dateStr];
    if (existingPost) {
      setQuote(existingPost.quote);
      setCaption(existingPost.caption);
      setStatus(existingPost.status);
      setEditingDeliveryFormat(existingPost.delivery_format);
      setEditingActiveBackgroundSource(existingPost.active_background_source);
    } else {
      setQuote('');
      setCaption('');
      setStatus('ready');
      setEditingDeliveryFormat('feed');
      setEditingActiveBackgroundSource('ai');
    }
    setCanvasDataUrl('');
  };

  const patchSelectedPost = (patch: Partial<Post>) => {
    if (!selectedDateStr) return;
    setPosts((prev) => {
      const current = prev[selectedDateStr];
      if (!current) return prev;
      return {
        ...prev,
        [selectedDateStr]: { ...current, ...patch },
      };
    });
  };

  const handleDeliveryFormatChange = (format: DeliveryFormat) => {
    setEditingDeliveryFormat(format);
    patchSelectedPost({ delivery_format: format });
  };

  const handleBackgroundSourceChange = (source: BackgroundSource) => {
    if (source === 'custom') {
      const post = selectedDateStr ? posts[selectedDateStr] : null;
      if (post && !hasCustomBackground(post)) {
        toast.error('Envie uma foto personalizada antes de ativar esta origem.');
        return;
      }
    }
    setEditingActiveBackgroundSource(source);
    patchSelectedPost({ active_background_source: source });
  };

  const handleUploadCustomPhoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDateStr) return;
    event.target.value = '';

    if (
      !ACCEPTED_CUSTOM_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_CUSTOM_IMAGE_TYPES)[number]
      )
    ) {
      toast.error('Formato inválido. Use JPEG, PNG ou WebP.');
      return;
    }

    setIsUploadingCustom(true);
    const toastId = toast.loading('Enviando foto personalizada...');

    try {
      if (isSupabaseConnected) {
        if (!adminPassword) {
          toast.error('Insira a senha administrativa para enviar fotos.', {
            id: toastId,
          });
          return;
        }

        const formData = new FormData();
        formData.append('date', selectedDateStr);
        formData.append('password', adminPassword);
        formData.append('file', file);

        const response = await fetch('/api/posts/upload-custom', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Falha no upload');
        }

        const post = normalizePost(result.data);
        setPosts((prev) => ({ ...prev, [selectedDateStr]: post }));
        setQuote(post.quote);
        setCaption(post.caption);
        setStatus(post.status);
        setEditingDeliveryFormat(post.delivery_format);
        setEditingActiveBackgroundSource(post.active_background_source);
        toast.success('Foto personalizada enviada!', { id: toastId });
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
          reader.readAsDataURL(file);
        });

        const existing = posts[selectedDateStr];
        const post: Post = {
          id: existing?.id ?? `post-${selectedDateStr}`,
          post_date: selectedDateStr,
          quote: existing?.quote || editingQuote || 'Sua frase aqui',
          caption: existing?.caption || editingCaption,
          image_url:
            existing?.image_url ||
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
          image_path: existing?.image_path ?? null,
          custom_image_url: dataUrl,
          custom_image_path: `local/${selectedDateStr}/background-custom`,
          delivery_format: editingDeliveryFormat,
          active_background_source: 'custom',
          status: existing?.status ?? 'draft',
        };

        setPosts((prev) => ({ ...prev, [selectedDateStr]: post }));
        setEditingActiveBackgroundSource('custom');
        if (!existing) {
          setQuote(post.quote);
          setCaption(post.caption);
          setStatus(post.status);
        }
        toast.success('Foto salva localmente (modo demo)!', { id: toastId });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro no upload';
      toast.error(message, { id: toastId });
    } finally {
      setIsUploadingCustom(false);
    }
  };

  const handleRemoveCustomPhoto = async () => {
    if (!selectedDateStr) return;
    const post = posts[selectedDateStr];
    if (!post || !hasCustomBackground(post)) return;

    if (isSupabaseConnected) {
      if (!adminPassword) {
        toast.error('Insira a senha administrativa para remover fotos.');
        return;
      }

      try {
        const response = await fetch('/api/posts/remove-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDateStr,
            password: adminPassword,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Falha ao remover');
        }

        const updated = normalizePost(result.data);
        setPosts((prev) => ({ ...prev, [selectedDateStr]: updated }));
        setEditingActiveBackgroundSource(updated.active_background_source);
        toast.success('Foto personalizada removida.');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao remover';
        toast.error(message);
      }
      return;
    }

    const updated: Post = {
      ...post,
      custom_image_url: null,
      custom_image_path: null,
      active_background_source:
        post.active_background_source === 'custom' ? 'ai' : post.active_background_source,
    };
    setPosts((prev) => ({ ...prev, [selectedDateStr]: updated }));
    setEditingActiveBackgroundSource(updated.active_background_source);
    toast.success('Foto personalizada removida (modo demo).');
  };

  // Gerar Post via IA
  const handleGeneratePost = async () => {
    if (!selectedDateStr) return;

    if (!adminPassword) {
      toast.error('Insira a senha administrativa para gerar posts por IA.');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('A IA está criando o post perfeito para você...');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDateStr,
          styleId: stylePreset,
          niche: niche,
          password: adminPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post gerado com sucesso!', { id: toastId });
        // Atualizar lista de posts
        const newPost = normalizePost({
          ...result.data,
          id: posts[selectedDateStr]?.id ?? `post-${selectedDateStr}`,
        });
        setPosts((prev) => ({
          ...prev,
          [selectedDateStr]: newPost,
        }));
        setQuote(newPost.quote);
        setCaption(newPost.caption);
        setStatus(newPost.status);
        setEditingDeliveryFormat(newPost.delivery_format);
        setEditingActiveBackgroundSource(newPost.active_background_source);
      } else {
        toast.error(`Erro: ${result.error || 'Falha na geração'}`, { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro de conexão com a API de geração.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Salvar alterações manuais no post
  const handleSaveChanges = async () => {
    if (!selectedDateStr) return;

    const existing = posts[selectedDateStr];
    const updatedPost: Post = {
      id: existing?.id || `post-${selectedDateStr}`,
      post_date: selectedDateStr,
      quote: editingQuote,
      caption: editingCaption,
      status: editingStatus,
      image_url:
        existing?.image_url ||
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
      image_path: existing?.image_path ?? null,
      custom_image_url: existing?.custom_image_url ?? null,
      custom_image_path: existing?.custom_image_path ?? null,
      delivery_format: editingDeliveryFormat,
      active_background_source: editingActiveBackgroundSource,
    };

    if (isSupabaseConnected) {
      try {
        const { error } = await supabase.from('posts').upsert({
          post_date: selectedDateStr,
          quote: editingQuote,
          caption: editingCaption,
          status: editingStatus,
          image_url: updatedPost.image_url,
          image_path: updatedPost.image_path,
          custom_image_url: updatedPost.custom_image_url,
          custom_image_path: updatedPost.custom_image_path,
          delivery_format: updatedPost.delivery_format,
          active_background_source: updatedPost.active_background_source,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'post_date' });

        if (error) throw error;
        toast.success('Alterações salvas no banco de dados!');
      } catch (e: any) {
        toast.error(`Erro ao salvar no banco: ${e.message}`);
        return;
      }
    } else {
      toast.success('Salvo localmente (Modo de Demonstração)');
    }

    setPosts((prev) => ({
      ...prev,
      [selectedDateStr]: updatedPost,
    }));
    setSelectedDateStr(null);
  };

  // Copiar Legenda para Área de Transferência
  const handleCopyCaption = () => {
    navigator.clipboard.writeText(editingCaption);
    toast.success('Legenda copiada com sucesso!');
  };

  // Baixar Post como PNG
  const handleDownloadPost = () => {
    if (!canvasDataUrl) {
      toast.error('Aguarde o carregamento completo do post para baixar.');
      return;
    }

    const link = document.createElement('a');
    link.download = `post-instagram-${selectedDateStr}-${editingDeliveryFormat}.png`;
    link.href = canvasDataUrl;
    link.click();
    toast.success('Download iniciado!');
  };

  // Excluir Post
  const handleDeletePost = async () => {
    if (!selectedDateStr) return;

    if (isSupabaseConnected) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('post_date', selectedDateStr);

        if (error) throw error;
      } catch (e: any) {
        toast.error(`Erro ao excluir: ${e.message}`);
        return;
      }
    }

    setPosts((prev) => {
      const updated = { ...prev };
      delete updated[selectedDateStr];
      return updated;
    });

    setQuote('');
    setCaption('');
    toast.success('Postagem removida do calendário.');
  };

  const days = getDaysInMonth();
  const activePreset = STYLES_PRESETS[stylePreset] || STYLES_PRESETS.minimalist;
  const selectedPost = selectedDateStr ? posts[selectedDateStr] : null;
  const previewBackgroundUrl = selectedPost
    ? getActiveBackgroundUrl({
        ...selectedPost,
        active_background_source: editingActiveBackgroundSource,
        custom_image_url: selectedPost.custom_image_url,
      })
    : '';
  const selectedPostHasCustom =
    selectedPost != null && hasCustomBackground(selectedPost);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Toaster position="top-right" theme="dark" />

      {/* Header Premium */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-2 rounded-xl text-white shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                InspirAI
              </h1>
              <p className="text-xs text-zinc-400">Calendário Inteligente de Conteúdo para Instagram</p>
            </div>
          </div>

          {/* Status de Integração */}
          <div className="flex items-center gap-3 text-xs">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              isSupabaseConnected 
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400' 
                : 'bg-amber-950/30 border-amber-800/50 text-amber-400'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Modo Demo (Local)'}</span>
            </div>

            <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'calendar' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'settings' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Configurações
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Lado Esquerdo: Calendário ou Configurações */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'calendar' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              {/* Controles de Mês */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-pink-500" />
                  <h2 className="text-lg font-semibold capitalize">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <div className="flex items-center space-x-1 bg-zinc-800 rounded-lg p-1 border border-zinc-700">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-2">
                {/* Dias da Semana */}
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-zinc-500 py-2">
                    {day}
                  </div>
                ))}

                {/* Dias do Mês */}
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square bg-zinc-950/20 rounded-xl" />;
                  }

                  const dateStr = formatDateString(day);
                  const post = posts[dateStr];
                  const isToday = formatDateString(new Date()) === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className={`group aspect-square relative rounded-xl border p-2 flex flex-col justify-between text-left transition-all overflow-hidden ${
                        isToday
                          ? 'border-pink-500 bg-pink-950/10'
                          : post
                          ? 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-500'
                          : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'
                      }`}
                    >
                      {/* Imagem de Fundo em Miniatura se houver post */}
                      {post && (
                        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                          <img
                            src={getActiveBackgroundUrl(post)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40" />
                        </div>
                      )}

                      {post && (
                        <span className="absolute top-1 right-1 z-20 text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-zinc-950/85 text-zinc-300 border border-zinc-700">
                          {post.delivery_format === 'story' ? 'Story' : 'Feed'}
                        </span>
                      )}

                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${isToday ? 'text-pink-400' : 'text-zinc-400'}`}>
                          {day.getDate()}
                        </span>
                        {post && (
                          <span className={`w-2 h-2 rounded-full ${
                            post.status === 'published' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                        )}
                      </div>

                      <div className="relative z-10 w-full mt-auto">
                        {post ? (
                          <p className="text-[10px] text-zinc-300 line-clamp-2 leading-tight font-medium">
                            {post.quote}
                          </p>
                        ) : (
                          <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 flex items-center gap-0.5 transition-colors">
                            <Plus className="w-2.5 h-2.5" /> Criar post
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold">Configurações de Geração</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Nicho / Tema Geral</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-pink-500 transition-colors text-sm"
                    placeholder="Ex: Desenvolvimento Pessoal, Finanças, Fitness..."
                  />
                  <p className="text-xs text-zinc-500">
                    O nicho orienta a inteligência artificial sobre o conteúdo das frases e legendas.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Estilo Visual Padrão</label>
                  <select
                    value={stylePreset}
                    onChange={(e) => setStylePreset(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-pink-500 transition-colors text-sm"
                  >
                    {Object.values(STYLES_PRESETS).map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500">
                    Define as fontes, cores e o estilo artístico do fundo gerado por IA.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Senha Administrativa</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-pink-500 transition-colors text-sm"
                      placeholder="Senha para autorizar geração de IA"
                    />
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  </div>
                  <p className="text-xs text-zinc-500">
                    Necessária para evitar disparos acidentais de geração por IA que consomem créditos de API.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Painel de Controle Rápido */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500" /> Resumo do Mês
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500">Total de Posts</span>
                <p className="text-xl font-bold mt-1">{Object.keys(posts).length}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500">Publicados</span>
                <p className="text-xl font-bold mt-1 text-emerald-400">
                  {Object.values(posts).filter((p) => p.status === 'published').length}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Nicho Atual:</span>
                <span className="font-semibold text-zinc-200">{niche}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Estilo Visual:</span>
                <span className="font-semibold text-zinc-200">{activePreset.name}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-pink-500" /> Instruções de Uso
            </h3>
            <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
              <li>Clique em qualquer dia do calendário para ver ou criar um post.</li>
              <li>Ajuste o texto, tamanho da fonte e legenda em tempo real.</li>
              <li>Baixe o post em alta resolução e copie a legenda para postar.</li>
              <li>Configure o nicho e estilo na aba de configurações.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Modal Lateral / Detalhes do Post Selecionado */}
      {selectedDateStr && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Cabeçalho do Modal */}
            <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Post do Dia {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-zinc-400">Edite, visualize e baixe seu post de Instagram</p>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Coluna Esquerda: Visualização do Canvas */}
              <div className="flex flex-col items-center justify-center bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50">
                {selectedPost ? (
                  <CanvasPost
                    quote={editingQuote}
                    imageUrl={previewBackgroundUrl}
                    preset={activePreset}
                    deliveryFormat={editingDeliveryFormat}
                    fontSize={fontSize}
                    onComposeReady={(url) => setCanvasDataUrl(url)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-sm">
                    <div className="bg-zinc-800 p-4 rounded-full text-zinc-500">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200">Nenhum post gerado</h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Use o poder da inteligência artificial para criar uma frase impactante e uma imagem de fundo conceitual para este dia.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleGeneratePost}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Gerando Post...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Post com IA
                        </>
                      )}
                    </button>

                    <input
                      ref={customPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleUploadCustomPhoto}
                    />
                    <button
                      type="button"
                      onClick={() => customPhotoInputRef.current?.click()}
                      disabled={isUploadingCustom}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 text-sm disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-pink-500" />
                      {isUploadingCustom ? 'Enviando foto...' : 'Usar minha foto'}
                    </button>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Formulários e Ações */}
              <div className="space-y-5 flex flex-col justify-between">
                {selectedPost ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          Formato de entrega
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['feed', 'story'] as const).map((format) => (
                            <button
                              key={format}
                              type="button"
                              onClick={() => handleDeliveryFormatChange(format)}
                              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                editingDeliveryFormat === format
                                  ? 'bg-pink-950/40 border-pink-500 text-pink-300'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {format === 'feed' ? 'Feed (1:1)' : 'Story (9:16)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          Origem do fundo
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleBackgroundSourceChange('ai')}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              editingActiveBackgroundSource === 'ai'
                                ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Fundo IA
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBackgroundSourceChange('custom')}
                            disabled={!selectedPostHasCustom}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              editingActiveBackgroundSource === 'custom'
                                ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Minha foto
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400">
                          Foto personalizada
                        </label>
                        <input
                          ref={customPhotoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleUploadCustomPhoto}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => customPhotoInputRef.current?.click()}
                            disabled={isUploadingCustom}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 text-xs disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5 text-pink-500" />
                            {isUploadingCustom ? 'Enviando...' : 'Enviar foto'}
                          </button>
                          {selectedPostHasCustom && (
                            <button
                              type="button"
                              onClick={handleRemoveCustomPhoto}
                              className="bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors text-xs"
                              title="Remover foto personalizada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          JPEG, PNG ou WebP. Ao enviar, a foto passa a ser a origem ativa.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Tamanho da Fonte</span>
                          <span className="font-semibold text-zinc-200">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="80"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-pink-500 bg-zinc-800 rounded-lg appearance-none h-1.5"
                        />
                      </div>

                      {/* Edição da Frase */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Frase do Post (Imagem)</label>
                        <textarea
                          rows={3}
                          value={editingQuote}
                          onChange={(e) => setQuote(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-pink-500 transition-colors text-sm"
                          placeholder="Digite a frase que aparecerá no post..."
                        />
                      </div>

                      {/* Edição da Legenda */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Legenda do Instagram</label>
                        <textarea
                          rows={6}
                          value={editingCaption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-pink-500 transition-colors text-sm font-mono"
                          placeholder="Escreva a legenda e hashtags..."
                        />
                      </div>

                      {/* Status do Post */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Status da Publicação</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['draft', 'ready', 'published'] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                                editingStatus === s
                                  ? s === 'published'
                                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                                    : s === 'ready'
                                    ? 'bg-blue-950/40 border-blue-500 text-blue-400'
                                    : 'bg-zinc-800 border-zinc-600 text-zinc-300'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {s === 'draft' ? 'Rascunho' : s === 'ready' ? 'Pronto' : 'Publicado'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleDownloadPost}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 text-sm"
                        >
                          <Download className="w-4 h-4 text-pink-500" />
                          Baixar Imagem
                        </button>
                        <button
                          onClick={handleCopyCaption}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 text-sm"
                        >
                          <Copy className="w-4 h-4 text-pink-500" />
                          Copiar Legenda
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveChanges}
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          Salvar Alterações
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-semibold p-2.5 rounded-xl flex items-center justify-center transition-colors"
                          title="Excluir Post"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-800">
                    <AlertCircle className="w-8 h-8 text-zinc-600 mb-2" />
                    <p className="text-xs text-zinc-500">
                      Gere o post para liberar as opções de edição de frase, legenda, download e publicação.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
