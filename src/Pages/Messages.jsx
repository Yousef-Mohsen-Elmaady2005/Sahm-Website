import { useEffect, useMemo, useState } from "react";
import { getConversationMessages, getConversations, searchChatUsers, sendChatMessage, startChatConversation } from "../api/auth";
import { getLanguage, t, useLanguage } from "../i18n";
import ValidatedForm from "../Component/ValidatedForm";

const listFromResponse = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.conversations)) return data.conversations;
  return [];
};

const conversationName = (conversation) => {
  const person = conversation?.other_user || conversation?.user || conversation?.participant;
  return conversation?.name || conversation?.title || conversation?.user_name ||
    conversation?.participant_name || conversation?.conversational || person?.name || person?.username ||
    (conversation?.id ? `محادثة ${conversation.id}` : "محادثة");
};

const conversationPreview = (conversation) => {
  const lastMessage = conversation?.last_message || conversation?.lastMessage || conversation?.message;
  return typeof lastMessage === "string" ? lastMessage : lastMessage?.message || "لا توجد رسائل";
};

const messageText = (message) => message?.message || message?.text || message?.content || "";

export default function Messages() {
  const { language } = useLanguage();
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [startingUserId, setStartingUserId] = useState("");
  const [startError, setStartError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    let active = true;
    getConversations()
      .then((response) => {
        if (!active) return;
        const items = listFromResponse(response);
        setConversations(items);
        setSelectedId((current) => current || String(items[0]?.id || ""));
      })
      .catch((error) => {
        if (active) setConversationError(error.response?.data?.message || t("تعذر تحميل المحادثات."));
      })
      .finally(() => { if (active) setLoadingConversations(false); });
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setMessageError("");
      return undefined;
    }
    let active = true;
    setLoadingMessages(true);
    setMessageError("");
    getConversationMessages(selectedId)
      .then((response) => { if (active) setMessages(listFromResponse(response)); })
      .catch((error) => {
        if (active) {
          setMessages([]);
          setMessageError(error.response?.data?.message || t("تعذر تحميل رسائل المحادثة."));
        }
      })
      .finally(() => { if (active) setLoadingMessages(false); });
    return () => { active = false; };
  }, [selectedId, language]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => String(item.id) === selectedId),
    [conversations, selectedId]
  );

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = searchName.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError(t("اكتب اسم المستخدم للبحث."));
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const response = await searchChatUsers(query);
      setSearchResults(listFromResponse(response));
    } catch (error) {
      setSearchResults([]);
      setSearchError(error.response?.data?.message || t("تعذر البحث عن المستخدمين."));
    } finally {
      setSearching(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!selectedId || !text || sending) return;
    setSending(true);
    setSendError("");
    try {
      await sendChatMessage({ conversation_id: selectedId, message: text });
      setDraft("");
      const response = await getConversationMessages(selectedId);
      setMessages(listFromResponse(response));
    } catch (error) {
      setSendError(error.response?.data?.message || t("تعذر إرسال الرسالة."));
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (user) => {
    if (!user?.id || startingUserId) return;
    setStartingUserId(String(user.id));
    setStartError("");
    try {
      const response = await startChatConversation(user.id);
      const created = response?.data?.data;
      const conversationId = created?.id || created?.conversation_id;
      if (!conversationId) throw new Error("لم يرجع الخادم رقم المحادثة.");
      setConversations((current) => {
        const exists = current.some((item) => String(item.id) === String(conversationId));
        return exists ? current : [created, ...current];
      });
      setSelectedId(String(conversationId));
      setSearchResults([]);
      setSearchName("");
      getConversations().then((listResponse) => {
        const items = listFromResponse(listResponse);
        setConversations(items);
        if (items.some((item) => String(item.id) === String(conversationId))) {
          setSelectedId(String(conversationId));
        }
      }).catch(() => {});
    } catch (error) {
      setStartError(error.response?.data?.message || error.message || t("تعذر بدء المحادثة."));
    } finally {
      setStartingUserId("");
    }
  };

  return (
    <main dir="rtl" className="min-h-[60vh] bg-gray-50 px-4 py-8 sm:px-8 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold text-[#2B65B3]">{t("الرسائل")}</h1>
        <section className="grid min-h-[460px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)]">
          <aside className="border-b border-gray-200 md:border-b-0 md:border-l" aria-label={t("المحادثات")}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-semibold text-slate-800">{t("المحادثات")}</h2>
            <ValidatedForm onSubmit={handleSearch} className="border-b border-gray-100 p-4">
              <label htmlFor="chat-user-search" className="mb-2 block text-sm font-medium text-slate-700">{t("ابحث عن مستخدم")}</label>
              <div className="flex gap-2">
                <input
                  id="chat-user-search"
                  type="search"
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder={t("اكتب الاسم")}
                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2B65B3] focus:ring-1 focus:ring-[#2B65B3]"
                />
                <button type="submit" disabled={searching} className="rounded-md bg-[#2B65B3] px-3 py-2 text-sm text-white disabled:opacity-60">
                  {searching ? "..." : t("بحث")}
                </button>
              </div>
              {searchError && <p className="mt-2 text-xs text-red-600" role="alert">{searchError}</p>}
              {startError && <p className="mt-2 text-xs text-red-600" role="alert">{startError}</p>}
              {searchResults.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-100">
                  {searchResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleStartConversation(user)}
                        disabled={Boolean(startingUserId)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-right hover:bg-blue-50 disabled:opacity-60"
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-[#2B65B3]">
                            {(user.name || "?").slice(0, 1)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{user.name || `مستخدم ${user.id}`}</span>
                        <span className="text-xs text-[#2B65B3]">{startingUserId === String(user.id) ? t("جاري الفتح...") : t("محادثة")}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!searching && searchName.trim() && searchResults.length === 0 && !searchError && (
                <p className="mt-2 text-xs text-slate-500">{t("لا توجد نتائج بحث.")}</p>
              )}
            </ValidatedForm>
            {loadingConversations ? (
              <p className="px-5 py-6 text-sm text-slate-500" role="status">{t("جاري تحميل المحادثات...")}</p>
            ) : conversationError ? (
              <p className="px-5 py-6 text-sm text-red-600" role="alert">{conversationError}</p>
            ) : conversations.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">{t("لا توجد محادثات حاليًا.")}</p>
            ) : (
              <ul>
                {conversations.map((conversation) => {
                  const active = String(conversation.id) === selectedId;
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(String(conversation.id))}
                        aria-current={active ? "true" : undefined}
                        className={`w-full border-b border-gray-100 px-5 py-4 text-right transition hover:bg-blue-50 ${active ? "bg-blue-50" : ""}`}
                      >
                        <span className="block font-medium text-slate-800">{conversationName(conversation)}</span>
                        <span className="mt-1 block truncate text-sm text-slate-500">{conversationPreview(conversation)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="flex min-h-[360px] flex-col">
            {selectedConversation ? (
              <h2 className="border-b border-gray-100 px-5 py-4 font-semibold text-slate-800">
                {conversationName(selectedConversation)}
              </h2>
            ) : (
              <h2 className="border-b border-gray-100 px-5 py-4 font-semibold text-slate-800">{t("تفاصيل المحادثة")}</h2>
            )}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
              {!selectedId && !loadingConversations && !conversationError && (
                <p className="m-auto text-center text-sm text-slate-500">{t("اختر محادثة لعرض الرسائل.")}</p>
              )}
              {loadingMessages && <p className="text-sm text-slate-500" role="status">{t("جاري تحميل الرسائل...")}</p>}
              {messageError && <p className="text-sm text-red-600" role="alert">{messageError}</p>}
              {!loadingMessages && !messageError && selectedId && messages.length === 0 && (
                <p className="m-auto text-center text-sm text-slate-500">{t("لا توجد رسائل في هذه المحادثة.")}</p>
              )}
              {messages.map((message, index) => {
                const mine = message?.is_mine === true || message?.is_sender === true || message?.sender_type === "me";
                return (
                  <article
                    key={message.id || `${message.created_at || "message"}-${index}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? "mr-auto bg-[#2B65B3] text-white" : "ml-auto bg-gray-100 text-slate-800"}`}
                  >
                    <p>{messageText(message)}</p>
                    {message.created_at && (
                      <time className={`mt-1 block text-[11px] ${mine ? "text-blue-100" : "text-slate-500"}`}>
                        {new Date(message.created_at).toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}
                      </time>
                    )}
                  </article>
                );
              })}
            </div>
            <ValidatedForm onSubmit={handleSendMessage} className="border-t border-gray-100 p-4">
              {sendError && <p className="mb-2 text-sm text-red-600" role="alert">{sendError}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!selectedId || sending}
                  placeholder={selectedId ? "اكتب رسالتك..." : "اختر محادثة أولًا"}
                  aria-label={t("نص الرسالة")}
                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2B65B3] focus:ring-1 focus:ring-[#2B65B3] disabled:bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={!selectedId || !draft.trim() || sending}
                  className="rounded-md bg-[#2B65B3] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? t("جاري الإرسال...") : t("إرسال")}
                </button>
              </div>
            </ValidatedForm>
          </div>
        </section>
      </div>
    </main>
  );
}
