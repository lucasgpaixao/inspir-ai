'use client';

import React, { useState, useEffect } from 'react';
import {
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

  useEffect(() => {
    if (!selectedDateStr) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedDateStr]);

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

  const publishedCount = Object.values(posts).filter(
    (p) => p.status === 'published'
  ).length;
  const totalPosts = Object.keys(posts).length;

  return (
    <div className="inspir-app inspir-grain min-h-screen flex relative">
      <Toaster position="top-right" theme="light" richColors />

      {/* Barra lateral editorial */}
      <aside className="relative z-20 hidden lg:flex w-[220px] shrink-0 flex-col border-r-2 border-[var(--inspir-ink)] bg-[var(--inspir-cream)] inspir-rise">
        <div className="p-6 pb-4">
          <p className="inspir-mono text-[var(--inspir-muted)] mb-3">Ateliê digital</p>
          <h1 className="inspir-display text-4xl leading-[0.95] tracking-tight text-[var(--inspir-ink)]">
            Inspir
            <span className="text-[var(--inspir-terracotta)]">AI</span>
          </h1>
          <div className="h-0.5 w-full bg-[var(--inspir-terracotta)] mt-4 inspir-underline" />
          <p className="mt-4 text-sm leading-relaxed text-[var(--inspir-ink-soft)]">
            Planeje frases e visuais para o Instagram, dia a dia.
          </p>
        </div>

        <nav className="flex flex-col gap-1 px-4 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`text-left px-4 py-3 text-sm font-semibold border-2 transition-all ${
              activeTab === 'calendar'
                ? 'inspir-tab-active border-[var(--inspir-ink)]'
                : 'border-transparent text-[var(--inspir-muted)] hover:border-[var(--inspir-line)] hover:text-[var(--inspir-ink)]'
            }`}
          >
            Calendário
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`text-left px-4 py-3 text-sm font-semibold border-2 transition-all ${
              activeTab === 'settings'
                ? 'inspir-tab-active border-[var(--inspir-ink)]'
                : 'border-transparent text-[var(--inspir-muted)] hover:border-[var(--inspir-line)] hover:text-[var(--inspir-ink)]'
            }`}
          >
            Configurações
          </button>
        </nav>

        <div className="p-4 mt-auto space-y-3">
          <div
            className={`inspir-mono flex items-center gap-2 px-3 py-2 border-2 ${
              isSupabaseConnected
                ? 'border-[var(--inspir-sage)] bg-[var(--inspir-sage-soft)] text-[var(--inspir-sage)]'
                : 'border-[var(--inspir-gold)] bg-[var(--inspir-paper)] text-[var(--inspir-gold)]'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>{isSupabaseConnected ? 'Supabase ativo' : 'Modo demonstração'}</span>
          </div>
          <p className="text-[10px] text-[var(--inspir-muted)] leading-snug px-1">
            Junho de inspiração · {currentDate.getFullYear()}
          </p>
        </div>
      </aside>

      {/* Cabeçalho mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b-2 border-[var(--inspir-ink)] bg-[var(--inspir-cream)] px-4 py-3 flex items-center justify-between inspir-rise">
        <h1 className="inspir-display text-2xl text-[var(--inspir-ink)]">
          Inspir<span className="text-[var(--inspir-terracotta)]">AI</span>
        </h1>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-2.5 py-1 text-xs font-bold border-2 ${
              activeTab === 'calendar' ? 'inspir-tab-active' : 'border-[var(--inspir-line)]'
            }`}
          >
            Cal.
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1 text-xs font-bold border-2 ${
              activeTab === 'settings' ? 'inspir-tab-active' : 'border-[var(--inspir-line)]'
            }`}
          >
            Config.
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 pt-[52px] lg:pt-0">
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 md:gap-8 inspir-rise" style={{ animationDelay: '0.08s' }}>
          {/* Área principal: calendário ou configurações */}
          <div className="min-w-0 space-y-6">
            {activeTab === 'calendar' ? (
              <section className="inspir-card p-5 md:p-8">
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                  <div>
                    <p className="inspir-mono text-[var(--inspir-muted)] mb-2">Edição mensal</p>
                    <h2 className="inspir-display text-3xl md:text-4xl capitalize text-[var(--inspir-ink)]">
                      {currentDate.toLocaleString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h2>
                  </div>
                  <div className="flex items-center border-2 border-[var(--inspir-ink)] self-start">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="p-2.5 hover:bg-[var(--inspir-paper-deep)] transition-colors"
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="w-px h-8 bg-[var(--inspir-ink)]" />
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-2.5 hover:bg-[var(--inspir-paper-deep)] transition-colors"
                      aria-label="Próximo mês"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div
                      key={day}
                      className="inspir-mono text-center py-2 text-[var(--inspir-muted)]"
                    >
                      {day}
                    </div>
                  ))}

                  {days.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="aspect-square border border-dashed border-[var(--inspir-line)]/60 bg-[var(--inspir-paper)]/50"
                        />
                      );
                    }

                    const dateStr = formatDateString(day);
                    const post = posts[dateStr];
                    const isToday = formatDateString(new Date()) === dateStr;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        style={{ animationDelay: `${Math.min(index * 12, 400)}ms` }}
                        className={`group inspir-rise aspect-square relative border-2 p-2 flex flex-col justify-between text-left transition-all overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--inspir-shadow-sm)] ${
                          isToday
                            ? 'inspir-day-today border-[var(--inspir-terracotta)]'
                            : post
                              ? 'border-[var(--inspir-ink)] bg-[var(--inspir-cream)]'
                              : 'border-[var(--inspir-line)] bg-[var(--inspir-paper)] hover:border-[var(--inspir-ink-soft)]'
                        }`}
                      >
                        {post && (
                          <div className="absolute inset-0 z-0 opacity-[0.22] group-hover:opacity-[0.38] transition-opacity duration-300">
                            <img
                              src={getActiveBackgroundUrl(post)}
                              alt=""
                              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0"
                            />
                            <div className="absolute inset-0 bg-[var(--inspir-cream)]/55 mix-blend-multiply" />
                          </div>
                        )}

                        {post && (
                          <span className="absolute top-1 right-1 z-20 inspir-mono px-1 py-0.5 bg-[var(--inspir-ink)] text-[var(--inspir-cream)]">
                            {post.delivery_format === 'story' ? 'Story' : 'Feed'}
                          </span>
                        )}

                        <div className="relative z-10 flex items-start justify-between w-full">
                          <span
                            className={`inspir-display text-lg leading-none ${
                              isToday
                                ? 'text-[var(--inspir-terracotta)]'
                                : 'text-[var(--inspir-ink)]'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                          {post && (
                            <span
                              className={`w-2 h-2 shrink-0 mt-1 ${
                                post.status === 'published'
                                  ? 'bg-[var(--inspir-sage)]'
                                  : 'bg-[var(--inspir-terracotta)]'
                              }`}
                            />
                          )}
                        </div>

                        <div className="relative z-10 w-full mt-auto pt-1">
                          {post ? (
                            <p className="text-[9px] md:text-[10px] text-[var(--inspir-ink-soft)] line-clamp-2 leading-tight font-medium">
                              {post.quote}
                            </p>
                          ) : (
                            <span className="text-[9px] text-[var(--inspir-muted)] group-hover:text-[var(--inspir-terracotta)] flex items-center gap-0.5 transition-colors inspir-mono">
                              <Plus className="w-2.5 h-2.5" /> Novo
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="inspir-card p-6 md:p-8 space-y-8">
                <header>
                  <p className="inspir-mono text-[var(--inspir-muted)] mb-2">Parâmetros da IA</p>
                  <h2 className="inspir-display text-3xl text-[var(--inspir-ink)] flex items-center gap-3">
                    <SettingsIcon className="w-7 h-7 text-[var(--inspir-terracotta)]" />
                    Configurações
                  </h2>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="inspir-mono text-[var(--inspir-muted)]">
                      Nicho / tema
                    </label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="inspir-input w-full px-4 py-3 text-sm"
                      placeholder="Ex: Desenvolvimento Pessoal..."
                    />
                    <p className="text-xs text-[var(--inspir-muted)] leading-relaxed">
                      Orienta frases e legendas geradas pela inteligência artificial.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="inspir-mono text-[var(--inspir-muted)]">
                      Estilo visual
                    </label>
                    <select
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      className="inspir-input w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                    >
                      {Object.values(STYLES_PRESETS).map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--inspir-muted)] leading-relaxed">
                      Fontes, cores e atmosfera do fundo gerado por IA.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="inspir-mono text-[var(--inspir-muted)]">
                      Senha administrativa
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="inspir-input w-full pl-11 pr-4 py-3 text-sm"
                        placeholder="Autorizar geração por IA"
                      />
                      <Lock className="w-4 h-4 text-[var(--inspir-muted)] absolute left-4 top-3.5" />
                    </div>
                    <p className="text-xs text-[var(--inspir-muted)] leading-relaxed">
                      Evita disparos acidentais que consomem créditos de API.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Coluna direita — métricas e guia */}
          <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
            <div className="inspir-card p-5 space-y-5">
              <h3 className="inspir-display text-xl text-[var(--inspir-ink)]">
                Resumo do mês
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-[var(--inspir-ink)] p-4 text-center bg-[var(--inspir-paper)]">
                  <span className="inspir-mono text-[var(--inspir-muted)]">Posts</span>
                  <p className="inspir-display text-4xl mt-1 text-[var(--inspir-ink)]">
                    {totalPosts}
                  </p>
                </div>
                <div className="border-2 border-[var(--inspir-sage)] p-4 text-center bg-[var(--inspir-sage-soft)]">
                  <span className="inspir-mono text-[var(--inspir-sage)]">Publicados</span>
                  <p className="inspir-display text-4xl mt-1 text-[var(--inspir-sage)]">
                    {publishedCount}
                  </p>
                </div>
              </div>
              <dl className="space-y-3 text-sm border-t-2 border-[var(--inspir-line)] pt-4">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--inspir-muted)]">Nicho</dt>
                  <dd className="font-semibold text-right text-[var(--inspir-ink)]">{niche}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--inspir-muted)]">Estilo</dt>
                  <dd className="font-semibold text-right text-[var(--inspir-ink)]">
                    {activePreset.name}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="inspir-card-inset p-5 space-y-3 border-2 border-[var(--inspir-line)]">
              <h3 className="inspir-mono text-[var(--inspir-ink-soft)] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Como usar
              </h3>
              <ol className="text-xs text-[var(--inspir-ink-soft)] space-y-2.5 list-decimal list-inside leading-relaxed">
                <li>Toque em um dia para abrir o ateliê do post.</li>
                <li>Ajuste frase, fonte e legenda em tempo real.</li>
                <li>Baixe o PNG e copie a legenda para publicar.</li>
                <li>Defina nicho e estilo na aba de configurações.</li>
              </ol>
            </div>

            <div className="hidden xl:block p-4 border-l-4 border-[var(--inspir-terracotta)] bg-[var(--inspir-cream)]/80">
              <p className="inspir-display text-lg italic text-[var(--inspir-ink-soft)] leading-snug">
                &ldquo;Um calendário vazio é um convite; um dia preenchido é uma promessa.&rdquo;
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Ateliê do post — modal (portal visual acima do app) */}
      {selectedDateStr && (
        <div
          className="inspir-modal-backdrop fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
          onClick={() => setSelectedDateStr(null)}
          role="presentation"
        >
          <div
            className="inspir-card relative z-[201] w-full sm:max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[min(92vh,880px)] flex flex-col overflow-hidden sm:rounded-none"
            style={{ boxShadow: 'var(--inspir-shadow)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="shrink-0 border-b-2 border-[var(--inspir-ink)] px-5 md:px-8 py-4 flex items-start justify-between gap-4 bg-[var(--inspir-paper)]">
              <div>
                <p className="inspir-mono text-[var(--inspir-muted)] mb-1">Ateliê do dia</p>
                <h3
                  id="post-dialog-title"
                  className="inspir-display text-2xl md:text-3xl text-[var(--inspir-ink)]"
                >
                  {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="inspir-btn-ghost px-4 py-2 text-sm font-bold shrink-0"
              >
                Fechar
              </button>
            </header>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:divide-x-2 md:divide-[var(--inspir-ink)] bg-[var(--inspir-cream)] overflow-hidden">
              <div className="min-h-0 flex flex-col items-center justify-center p-4 sm:p-6 border-b-2 md:border-b-0 border-[var(--inspir-line)] bg-[var(--inspir-paper)] overflow-y-auto md:overflow-hidden max-h-[45vh] md:max-h-none shrink-0 md:shrink md:flex-1">
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
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-5 max-w-xs">
                    <div className="border-2 border-[var(--inspir-ink)] p-5 text-[var(--inspir-terracotta)]">
                      <Sparkles className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="inspir-display text-xl text-[var(--inspir-ink)]">
                        Dia em branco
                      </h4>
                      <p className="text-xs text-[var(--inspir-muted)] mt-2 leading-relaxed">
                        Gere frase e fundo com IA ou envie sua própria fotografia.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGeneratePost}
                      disabled={isGenerating}
                      className="inspir-btn-primary w-full font-bold py-3 px-4 flex items-center justify-center gap-2 text-sm"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar com IA
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
                      className="inspir-btn-ghost w-full font-semibold py-3 px-4 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploadingCustom ? 'Enviando...' : 'Minha foto'}
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex flex-col overflow-y-auto p-5 md:p-6">
                {selectedPost ? (
                  <>
                    <div className="space-y-4 pb-4">
                      <div className="space-y-1.5">
                        <label className="inspir-mono text-[var(--inspir-muted)]">
                          Formato
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['feed', 'story'] as const).map((format) => (
                            <button
                              key={format}
                              type="button"
                              onClick={() => handleDeliveryFormatChange(format)}
                              className={`py-2 text-xs font-bold border-2 transition-all ${
                                editingDeliveryFormat === format
                                  ? 'inspir-chip-active'
                                  : 'border-[var(--inspir-line)] text-[var(--inspir-muted)] hover:border-[var(--inspir-ink-soft)]'
                              }`}
                            >
                              {format === 'feed' ? 'Feed 1:1' : 'Story 9:16'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="inspir-mono text-[var(--inspir-muted)]">
                          Fundo
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleBackgroundSourceChange('ai')}
                            className={`py-2 text-xs font-bold border-2 transition-all ${
                              editingActiveBackgroundSource === 'ai'
                                ? 'inspir-chip-active'
                                : 'border-[var(--inspir-line)] text-[var(--inspir-muted)] hover:border-[var(--inspir-ink-soft)]'
                            }`}
                          >
                            IA
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBackgroundSourceChange('custom')}
                            disabled={!selectedPostHasCustom}
                            className={`py-2 text-xs font-bold border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              editingActiveBackgroundSource === 'custom'
                                ? 'inspir-chip-active'
                                : 'border-[var(--inspir-line)] text-[var(--inspir-muted)] hover:border-[var(--inspir-ink-soft)]'
                            }`}
                          >
                            Minha foto
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="inspir-mono text-[var(--inspir-muted)]">
                          Upload
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
                            className="inspir-btn-ghost flex-1 font-semibold py-2 px-3 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isUploadingCustom ? 'Enviando...' : 'Enviar'}
                          </button>
                          {selectedPostHasCustom && (
                            <button
                              type="button"
                              onClick={handleRemoveCustomPhoto}
                              className="border-2 border-[var(--inspir-terracotta)] text-[var(--inspir-terracotta)] font-bold py-2 px-3 flex items-center justify-center gap-1 text-xs hover:bg-[var(--inspir-terracotta)] hover:text-[var(--inspir-cream)] transition-colors"
                              title="Remover foto personalizada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--inspir-muted)]">
                          JPEG, PNG ou WebP.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between inspir-mono text-[var(--inspir-muted)]">
                          <span>Fonte</span>
                          <span className="text-[var(--inspir-ink)]">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="80"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-[var(--inspir-terracotta)] h-2 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="inspir-mono text-[var(--inspir-muted)]">
                          Frase na imagem
                        </label>
                        <textarea
                          rows={3}
                          value={editingQuote}
                          onChange={(e) => setQuote(e.target.value)}
                          className="inspir-input w-full p-3 text-sm resize-none"
                          placeholder="A frase que aparece no post..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="inspir-mono text-[var(--inspir-muted)]">
                          Legenda
                        </label>
                        <textarea
                          rows={5}
                          value={editingCaption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="inspir-input w-full p-3 text-sm font-mono resize-none"
                          placeholder="Legenda e hashtags..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="inspir-mono text-[var(--inspir-muted)]">
                          Status
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['draft', 'ready', 'published'] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={`py-2 text-[10px] font-bold border-2 transition-all ${
                                editingStatus === s
                                  ? s === 'published'
                                    ? 'bg-[var(--inspir-sage)] border-[var(--inspir-sage)] text-[var(--inspir-cream)]'
                                    : 'inspir-chip-active'
                                  : 'border-[var(--inspir-line)] text-[var(--inspir-muted)]'
                              }`}
                            >
                              {s === 'draft'
                                ? 'Rascunho'
                                : s === 'ready'
                                  ? 'Pronto'
                                  : 'Publicado'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-5 mt-auto border-t-2 border-[var(--inspir-line)] space-y-3 sticky bottom-0 bg-[var(--inspir-cream)] pb-1">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={handleDownloadPost}
                          className="inspir-btn-ghost font-semibold py-2.5 px-4 flex items-center justify-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Baixar PNG
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyCaption}
                          className="inspir-btn-ghost font-semibold py-2.5 px-4 flex items-center justify-center gap-2 text-sm"
                        >
                          <Copy className="w-4 h-4" />
                          Copiar legenda
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveChanges}
                          className="inspir-btn-primary flex-1 font-bold py-2.5 px-4 flex items-center justify-center gap-2 text-sm"
                        >
                          <Check className="w-4 h-4" />
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={handleDeletePost}
                          className="border-2 border-[var(--inspir-terracotta)] text-[var(--inspir-terracotta)] font-bold px-4 py-2.5 hover:bg-[var(--inspir-terracotta)] hover:text-[var(--inspir-cream)] transition-colors text-sm"
                          title="Excluir post"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-8 border-2 border-dashed border-[var(--inspir-line)]">
                    <AlertCircle className="w-8 h-8 text-[var(--inspir-muted)] mb-3" />
                    <p className="text-xs text-[var(--inspir-muted)] leading-relaxed max-w-[220px]">
                      Gere o post para editar frase, legenda e exportar a imagem.
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
