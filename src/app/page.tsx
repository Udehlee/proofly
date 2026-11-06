
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import DocumentUpload, {type DocumentMeta} from "@/components/documents/document-upload";
import AuthForm from "@/components/auth/auth-form";
import DocumentInfoCard from "@/components/analysis/document-card";
import AnalysisTabs from "@/components/analysis/analysis-tab";
import QuestionAnswerTab from "@/components/analysis/questionAnswer-tab";
import EvidenceTab from "@/components/analysis/evidence-tab";
import SummaryTab from "@/components/analysis/summary-tab";
import SaveResults from "@/components/analysis/save-result";
import { ensureGuestSession } from "@/lib/guest";
import { MIN_QUESTION_LENGTH } from "@/lib/constants";
import {createEvaluation, runEvaluation, getEvaluationResult} from "@/lib/evaluation/evaluation-actions";
import { getCachedSummary, saveCachedSummary} from "@/lib/utils/summary";
import {getStorage, setStorage, removeStorage} from "@/lib/utils/storage";
import type { EvaluationResult, DocumentChunkItem, AnalysisTab} from "@/types/types";

const DOCUMENT_KEY = "proofly_active_doc";
const TAB_KEY = "proofly_active_tab";

export default function Home() {
  const [activeDocument, setActiveDocument] = useState<DocumentMeta | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("qa");

  // Authentication
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] =useState<"login" | "signup">("signup");
  const [authenticatedUserEmail, setAuthenticatedUserEmail] =useState<string | null>(null);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);

  // Questions and answers
  const [questionInput, setQuestionInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);

  // Evidence
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Summary
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Update active document
  const updateActiveDocument = useCallback(
    (document: DocumentMeta | null) => {
      setActiveDocument(document);

      if (document) {
        setStorage(DOCUMENT_KEY, JSON.stringify(document));
      } else {
        removeStorage(DOCUMENT_KEY);
        removeStorage(TAB_KEY);
        setActiveTab("qa");
      }
    },
    []
  );

  // Initialize guest session
  useEffect(() => {
    async function initializeGuest() {
      try {
        const session = await ensureGuestSession();

        if (session?.user && !session.user.is_anonymous) {
          setAuthenticatedUserEmail(session.user.email ?? null);
        }
      } catch (error) {
        console.warn("Session initialization error:", error);
      }
    }

    initializeGuest();
  }, []);

  // Restore previous document and tab
  useEffect(() => {
    const storedDocument = getStorage(DOCUMENT_KEY);

    if (storedDocument) {
      try {
        const document = JSON.parse(storedDocument);
        if (document?.id && document?.filename) {
          setActiveDocument(document);
        }
      } catch {
        removeStorage(DOCUMENT_KEY);
      }
    }

    const storedTab = getStorage(TAB_KEY);
    if (
      storedTab === "qa" ||
      storedTab === "evidence" ||
      storedTab === "summary"
    ) {
      setActiveTab(storedTab);
    }
  }, []);

  // Load evaluations
  useEffect(() => {
    if (!activeDocument) return;

    const documentId = activeDocument.id;
    let cancelled = false;

    async function loadEvaluations() {
      try {
        const response = await fetch(
          `/api/evaluations?documentId=${encodeURIComponent(documentId)}`
        );

        if (cancelled) return;
        if (response.status === 404 || response.status === 403) {
          updateActiveDocument(null);
          return;
        }

        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setEvaluations(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Could not load evaluations:", error);
        }
      }
    }

    loadEvaluations();
    return () => {
      cancelled = true;
    };
  }, [activeDocument, updateActiveDocument]);

  // Load document evidence
  async function loadEvidence(documentId: string) {
    if (chunks.length > 0 || loadingChunks) return;
    setLoadingChunks(true);

    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.status === 404 || response.status === 403) {
        updateActiveDocument(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load document evidence.");
      }

      const data = await response.json();
      if (Array.isArray(data.chunks)) {
        setChunks(data.chunks);
      }
    } catch (error) {
      console.error("Evidence loading error:", error);
    } finally {
      setLoadingChunks(false);
    }
  }

  // Load document summary
  async function loadSummary(documentId: string) {
    if (summaryText || loadingSummary || summaryError) return;

    const cachedSummary = getCachedSummary(documentId);

    if (cachedSummary) {
      setSummaryText(cachedSummary);
      return;
    }

    setLoadingSummary(true);
    try {
      const response = await fetch(
        `/api/documents/${documentId}/summary`
      );

      if (response.status === 404 || response.status === 403) {
        updateActiveDocument(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate summary.");
      }

      const data = await response.json();
      if (!data.summary) {
        setSummaryError(
          data.error || "Could not generate document summary."
        );
        return;
      }

      setSummaryText(data.summary);
      saveCachedSummary(documentId, data.summary);
    } catch (error) {
      console.error("Summary error:", error);
      setSummaryError("Failed to generate document summary.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function switchTab(tab: AnalysisTab) {
    setActiveTab(tab);
    setStorage(TAB_KEY, tab);

    if (!activeDocument) return;
    if (tab === "evidence") {
      await loadEvidence(activeDocument.id);
    }

    if (tab === "summary") {
      await loadSummary(activeDocument.id);
    }
  }

  async function handleAskQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeDocument || isAsking) return;

    const question = questionInput.trim();

    if (!question) return;
    if (question.length < MIN_QUESTION_LENGTH) { // question.length < 5
      setErrorMessage(`Question must be at least ${MIN_QUESTION_LENGTH} characters long.`); // Question must be at least 5 characters long.
      return;
    }

    setIsAsking(true);
    setErrorMessage("");

    try {
      await ensureGuestSession();
      const evaluation = await createEvaluation(
        question,
        activeDocument.id
      );

      if (!evaluation.id) {
        throw new Error("Evaluation ID was not returned.");
      }

      await runEvaluation(evaluation.id);
      const result = await getEvaluationResult(evaluation.id);

      setEvaluations((previous) => [result, ...previous]);
      setQuestionInput("");
    } catch (error) {
      console.error("Question evaluation error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing your question."
      );
    } finally {
      setIsAsking(false);
    }
  }

  function handleUploadSuccess(document: DocumentMeta) {
    updateActiveDocument(document);

    setActiveTab("qa");
    setStorage(TAB_KEY, "qa");

    setEvaluations([]);
    setChunks([]);
    setLoadingChunks(false);

    setSummaryText(null);
    setLoadingSummary(false);
    setSummaryError("");

    setErrorMessage("");
    setQuestionInput("");
    setSavedConfirmation(null);
  }

  // Open authentication modal
  function openAuthModal(mode: "login" | "signup") {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }

  return (
    <main className="min-h-[calc(100vh-70px)] bg-[#f8fafc]">
      {!activeDocument ? (
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div className="max-w-[840px] mx-auto px-4 pt-9 pb-20">
          <DocumentInfoCard
            document={activeDocument}
            onUploadAnother={() => updateActiveDocument(null)}
          />

          <AnalysisTabs
            activeTab={activeTab}
            onTabChange={switchTab}
          />

          {activeTab === "qa" && (
            <QuestionAnswerTab
              questionInput={questionInput}
              setQuestionInput={setQuestionInput}
              isAsking={isAsking}
              errorMessage={errorMessage}
              evaluations={evaluations}
              activeDocumentFilename={activeDocument.filename}
              onAskQuestion={handleAskQuestion}
            />
          )}

          {activeTab === "evidence" && (
            <EvidenceTab
              chunks={chunks}
              loading={loadingChunks}
            />
          )}

          {activeTab === "summary" && (
            <SummaryTab
              summaryText={summaryText}
              loading={loadingSummary}
              error={summaryError}
            />
          )}

          <SaveResults
            savedConfirmation={savedConfirmation}
            authenticatedUserEmail={authenticatedUserEmail}
            onSave={() => openAuthModal("signup")}
          />
        </div>
      )}

      {authModalOpen && (
        <div
          className="overlay"
          onClick={() => setAuthModalOpen(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <AuthForm
              mode={authModalMode}
              title={
                authModalMode === "signup"
                  ? "Save your results"
                  : "Sign in to save"
              }
              subtitle="Create an account or sign in to save your document, questions and answers."
              onClose={() => setAuthModalOpen(false)}
              onSuccess={(email) => {
                setAuthModalOpen(false);
                setAuthenticatedUserEmail(email);
                setSavedConfirmation(`Work saved to ${email}`);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
