import React, { useState, useRef, useEffect } from "react";
import { ImagePlus, Send, X, Mic, Trash2, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isCancelledRef = useRef(false);

  const { sendMessage, selectedConversation } = useChatStore();
  const { socket, authUser } = useAuthStore();
  const typingTimeoutRef = useRef(null);

  // Clean up recording stream & timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    if (socket && selectedConversation) {
      socket.emit("typing", {
        conversationId: selectedConversation._id || selectedConversation.id,
        name: authUser.fullName,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          conversationId: selectedConversation._id || selectedConversation.id,
        });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    await sendMessage({
      text: text.trim(),
      image: imagePreview,
    });

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (socket && selectedConversation) {
      socket.emit("stopTyping", {
        conversationId: selectedConversation._id || selectedConversation.id,
      });
    }
  };

  // --- Voice Recording Handlers ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("المتصفح لا يدعم التسجيل أو الموقع ليس HTTPS");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // If cancelled by user, discard
        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (audioBlob.size === 0) return;

        // Convert blob to base64 data URL
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          let base64Audio = reader.result;
          if (typeof base64Audio === "string") {
            base64Audio = base64Audio.replace(/;codecs=[^;]+/, "");
          }
          try {
            setIsSendingAudio(true);
            await sendMessage({ audio: base64Audio });
          } catch (err) {
            console.error("Failed to send audio message", err);
            toast.error("Failed to send voice note");
          } finally {
            setIsSendingAudio(false);
          }
        };
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("يرجى تفعيل إذن المايكروفون من إعدادات المتصفح (علامة 🔒)");
      } else {
        toast.error("تعذر الوصول إلى المايكروفون");
      }
    }
  };

  const stopAndSendRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    isCancelledRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    isCancelledRef.current = true;
    setIsRecording(false);
    setRecordingTime(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 bg-base-100 border-t border-base-300">
      {imagePreview && (
        <div className="mb-4 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-base-300 flex items-center justify-center hover:bg-error hover:text-white transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isRecording ? (
        /* Recording UI Bar */
        <div className="flex items-center gap-3 bg-base-200/90 rounded-full px-4 py-2 border border-primary/30 animate-pulse">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-3 h-3 rounded-full bg-error animate-ping" />
            <span className="text-xs font-semibold text-error">Recording...</span>
            <span className="text-xs font-mono font-bold text-base-content/80 ml-2">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>

          <button
            type="button"
            onClick={cancelRecording}
            className="btn btn-circle btn-sm btn-ghost text-error hover:bg-error/10"
            title="Cancel recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={stopAndSendRecording}
            disabled={isSendingAudio}
            className="btn btn-circle btn-sm btn-primary"
            title="Send voice note"
          >
            {isSendingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
        /* Standard Message Input */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="input input-bordered w-full rounded-full pl-4 pr-12 bg-base-200 focus:outline-none"
              placeholder="Type a message..."
              value={text}
              onChange={handleTyping}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-circle btn-sm btn-ghost text-base-content/60 hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>

          {text.trim() || imagePreview ? (
            <button
              type="submit"
              className="btn btn-circle btn-primary"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isSendingAudio}
              className="btn btn-circle btn-ghost text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Record voice note"
            >
              {isSendingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default MessageInput;
