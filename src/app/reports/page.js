"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/SettingsContext";
import { useReports } from "@/lib/ReportsContext";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Video,
  LogOut,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  Phone,
  ChevronDown,
  Check,
  Send,
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const { t, theme, mounted } = useSettings();
  const { reports, loading: reportsLoading, fetchReports, updateReport, deleteReport } = useReports();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();

  // Fetch reports once when this page is opened (not on app load, so home page doesn't re-render/refresh)
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on mount
  }, []);

  const [filter, setFilter] = useState("all");
  const [editingReport, setEditingReport] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [showAuthorityDropdown, setShowAuthorityDropdown] = useState(false);
  const [notifiedAuthorities, setNotifiedAuthorities] = useState({});

  // Singapore Emergency Contacts
  const emergencyContacts = [
    { id: "police", name: "Police (999)", number: "999", description: "Emergency Police" },
    { id: "scdf", name: "Ambulance & Fire (995)", number: "995", description: "SCDF - Medical & Fire Emergency" },
    { id: "spf_non_emergency", name: "Police Non-Emergency (1800-255-0000)", number: "1800-255-0000", description: "SPF Non-Emergency Hotline" },
    { id: "aic", name: "AIC Hotline (1800-650-6060)", number: "1800-650-6060", description: "Agency for Integrated Care - Elderly Support" },
    { id: "sgh", name: "SGH A&E (6321-4311)", number: "6321-4311", description: "Singapore General Hospital A&E" },
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [authLoading, isAdmin, router]);

  // Theme-based colors
  const colors = {
    bg: theme === "light" ? "#F8F5F2" : "#0D0D0D",
    text: theme === "light" ? "#1A1A1A" : "#FFFFFF",
    textMuted: theme === "light" ? "#666666" : "#CCCCCC",
    textDim: theme === "light" ? "#999999" : "#666666",
    cardBg: theme === "light" ? "#FFFFFF" : "#1A1A1A",
    cardBorder: theme === "light" ? "#E5E5E5" : "#2A2A2A",
    tableBg: theme === "light" ? "#FFFFFF" : "#141414",
    tableRowHover: theme === "light" ? "#F5F5F5" : "#1F1F1F",
    tableHeader: theme === "light" ? "#F8F8F8" : "#1A1A1A",
    inputBg: theme === "light" ? "#F5F5F5" : "#0D0D0D",
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#F5C400]" />
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  // Normalize classification for display and filter (DB may have "Not Urgent", "not urgent", etc.)
  const norm = (c) => {
    if (!c || typeof c !== "string") return c;
    const lower = c.trim().toLowerCase();
    if (lower === "not urgent" || lower === "non-urgent") return "Non-Urgent";
    if (lower === "urgent") return "Urgent";
    if (lower === "false alarm" || lower === "uncertain") return "False Alarm";
    return c;
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const classification = norm(report.classification);
    if (filter === "all") return true;
    if (filter === "urgent") return classification === "Urgent";
    if (filter === "non-urgent") return classification === "Not Urgent";
    if (filter === "false-alarm") return classification === "False Alarm";
    return true;
  });

  // Stats
  const stats = {
    total: reports.length,
    urgent: reports.filter((r) => norm(r.classification) === "Urgent").length,
    resolved: reports.filter((r) => r.status === "Resolved" || r.status === "Closed").length,
  };

  // Format date (guards against missing/invalid dateString)
  const formatDate = (dateString) => {
    if (dateString == null) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Style helpers (accept both "Non-Urgent" and "Not Urgent" for display)
  const getClassificationStyle = (classification) => {
    const c = norm(classification);
    switch (c) {
      case "Urgent":
        return { bg: "rgba(192, 57, 43, 0.15)", color: "#E74C3C", border: "rgba(192, 57, 43, 0.3)" };
      case "Non-Urgent":
        return { bg: "rgba(245, 196, 0, 0.15)", color: "#F5C400", border: "rgba(245, 196, 0, 0.3)" };
      case "False Alarm":
        return { bg: "rgba(100, 100, 100, 0.15)", color: "#888888", border: "rgba(100, 100, 100, 0.3)" };
      default:
        return { bg: "rgba(100, 100, 100, 0.15)", color: "#888888", border: "rgba(100, 100, 100, 0.3)" };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return { bg: "rgba(245, 196, 0, 0.15)", color: "#F5C400" };
      case "Under Review": return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" };
      case "Resolved": return { bg: "rgba(34, 197, 94, 0.15)", color: "#22C55E" };
      case "Closed": return { bg: "rgba(100, 100, 100, 0.15)", color: "#888888" };
      default: return { bg: "rgba(100, 100, 100, 0.15)", color: "#888888" };
    }
  };

  const getConfidenceStyle = (confidence) => {
    switch (confidence) {
      case "High": return "#22C55E";
      case "Medium": return "#F5C400";
      case "Low": return "#888888";
      default: return "#888888";
    }
  };

  // Edit handlers
  const handleEdit = (report) => {
    setEditingReport(report.id);
    setEditForm({
      title: report.title,
      classification: norm(report.classification),
      status: report.status,
      summary: report.summary,
    });
  };

  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      await updateReport(editingReport, editForm);
      setEditingReport(null);
      setEditForm({});
    } catch (error) {
      alert("Failed to update report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await deleteReport(id);
      setDeleteConfirm(null);
    } catch (error) {
      alert("Failed to delete report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: theme === "light" ? "rgba(248,245,242,0.9)" : "rgba(13,13,13,0.9)",
          borderColor: colors.cardBorder,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-black/5"
                style={{ color: colors.textMuted }}
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-['Barlow'] text-sm font-medium hidden sm:inline">
                  {mounted ? t("backToHome") : "Back to Home"}
                </span>
              </button>
              <div className="h-6 w-px bg-current opacity-20" />
              <h1 className="font-['Barlow_Condensed'] text-2xl font-bold">
                {mounted ? t("reports") : "Reports"}
              </h1>
            </div>
            
            {/* Admin info & Sign out */}
            <div className="flex items-center gap-3">
              <span className="font-['Barlow'] text-sm hidden sm:inline" style={{ color: colors.textMuted }}>
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-red-500/10"
                style={{ color: "#E74C3C" }}
              >
                <LogOut className="h-4 w-4" />
                <span className="font-['Barlow'] text-sm font-medium hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats Cards */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
            style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderStyle: "solid", borderColor: colors.cardBorder }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}>
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-['Barlow'] text-sm" style={{ color: colors.textMuted }}>{mounted ? t("totalReports") : "Total Reports"}</p>
                <p className="font-['Barlow_Condensed'] text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
            style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderStyle: "solid", borderColor: colors.cardBorder }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(192, 57, 43, 0.15)" }}>
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="font-['Barlow'] text-sm" style={{ color: colors.textMuted }}>{mounted ? t("urgentCases") : "Urgent Cases"}</p>
                <p className="font-['Barlow_Condensed'] text-3xl font-bold text-red-500">{stats.urgent}</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
            style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderStyle: "solid", borderColor: colors.cardBorder }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-['Barlow'] text-sm" style={{ color: colors.textMuted }}>{mounted ? t("resolvedCases") : "Resolved"}</p>
                <p className="font-['Barlow_Condensed'] text-3xl font-bold text-green-500">{stats.resolved}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="mb-4">
          <div
            className="inline-flex rounded-xl p-1"
            style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderStyle: "solid", borderColor: colors.cardBorder }}
          >
            {[
              { key: "all", label: "All" },
              { key: "urgent", label: mounted ? t("urgent") : "Urgent" },
              { key: "non-urgent", label: mounted ? t("nonUrgent") : "Non-Urgent" },
              { key: "false-alarm", label: mounted ? t("falseAlarm") : "False Alarm" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="rounded-lg px-4 py-2 font-['Barlow'] text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: filter === tab.key ? "#F5C400" : "transparent",
                  color: filter === tab.key ? "#000000" : colors.textMuted,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Reports Table */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.tableBg, borderWidth: "1px", borderStyle: "solid", borderColor: colors.cardBorder }}
        >
          {reportsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#F5C400]" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full mb-4" style={{ backgroundColor: "rgba(100, 100, 100, 0.1)" }}>
                <FileText className="h-10 w-10" style={{ color: colors.textDim }} />
              </div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-semibold mb-2">
                {filter !== "all" && reports.length > 0
                  ? (filter === "non-urgent"
                    ? (mounted ? t("noNonUrgentReports") : "No non-urgent reports")
                    : filter === "urgent"
                      ? (mounted ? t("noUrgentReports") : "No urgent reports")
                      : (mounted ? t("noFalseAlarmReports") : "No false alarm reports"))
                  : (mounted ? t("noReports") : "No reports yet")}
              </h3>
              <p className="font-['Barlow'] text-sm text-center" style={{ color: colors.textMuted }}>
                {filter !== "all" && reports.length > 0
                  ? (mounted ? t("noReportsInCategoryDesc") : "Try another filter or send an alert to see reports here.")
                  : (mounted ? t("noReportsDesc") : "Emergency alerts will appear here after they are sent.")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: colors.tableHeader }}>
                    <th className="px-4 py-4 text-left font-['Barlow'] text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{mounted ? t("date") : "Date"}</th>
                    <th className="px-4 py-4 text-left font-['Barlow'] text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{mounted ? t("title") : "Title"}</th>
                    <th className="px-4 py-4 text-left font-['Barlow'] text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{mounted ? t("classification") : "Classification"}</th>
                    <th className="px-4 py-4 text-left font-['Barlow'] text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{mounted ? t("statusLabel") : "Status"}</th>
                    <th className="px-4 py-4 text-center font-['Barlow'] text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{mounted ? t("actions") : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report, index) => {
                    const classStyle = getClassificationStyle(report.classification);
                    const displayClassification = norm(report.classification);
                    const statusStyle = getStatusStyle(report.status);
                    const isEditing = editingReport === report.id;

                    return (
                      <tr
                        key={report.id}
                        className="transition-colors duration-150 cursor-pointer hover:bg-black/5"
                        onClick={() => {
                          if (!isEditing) {
                            setSelectedReport(report);
                            setSelectedAuthority("");
                            setShowAuthorityDropdown(false);
                          }
                        }}
                        style={{
                          borderTopWidth: index > 0 ? "1px" : "0",
                          borderTopStyle: "solid",
                          borderTopColor: colors.cardBorder,
                          backgroundColor: isEditing ? (theme === "light" ? "#FFFBEB" : "#1F1F0F") : "transparent",
                        }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" style={{ color: colors.textDim }} />
                            <span className="font-['Barlow'] text-sm" style={{ color: colors.textMuted }}>{formatDate(report.date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full rounded-lg px-3 py-2 font-['Barlow'] text-sm outline-none"
                              style={{ backgroundColor: colors.inputBg, color: colors.text, borderWidth: "1px", borderColor: colors.cardBorder }}
                            />
                          ) : (
                            <div>
                              <p className="font-['Barlow'] font-medium" style={{ color: colors.text }}>{report.title}</p>
                              <p className="font-['Barlow'] text-xs mt-1 line-clamp-1" style={{ color: colors.textMuted }}>{report.summary}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <select
                              value={editForm.classification}
                              onChange={(e) => setEditForm({ ...editForm, classification: e.target.value })}
                              className="rounded-lg px-3 py-2 font-['Barlow'] text-sm outline-none"
                              style={{ backgroundColor: colors.inputBg, color: colors.text, borderWidth: "1px", borderColor: colors.cardBorder }}
                            >
                              <option value="Urgent">Urgent</option>
                              <option value="Non-Urgent">Non-Urgent</option>
                              <option value="False Alarm">False Alarm</option>
                            </select>
                          ) : (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full font-['Barlow'] text-xs font-semibold"
                              style={{ backgroundColor: classStyle.bg, color: classStyle.color, borderWidth: "1px", borderColor: classStyle.border }}
                            >
                              {displayClassification === "Urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {displayClassification}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="rounded-lg px-3 py-2 font-['Barlow'] text-sm outline-none"
                              style={{ backgroundColor: colors.inputBg, color: colors.text, borderWidth: "1px", borderColor: colors.cardBorder }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          ) : (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full font-['Barlow'] text-xs font-medium"
                              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                            >
                              {report.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={actionLoading}
                                  className="p-2 rounded-lg transition-colors hover:bg-green-500/20"
                                  style={{ color: "#22C55E" }}
                                >
                                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => { setEditingReport(null); setEditForm({}); }}
                                  className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                                  style={{ color: "#E74C3C" }}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(report); }}
                                  className="p-2 rounded-lg transition-colors hover:bg-blue-500/20"
                                  style={{ color: "#3B82F6" }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(report.id); }}
                                  className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                                  style={{ color: "#E74C3C" }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderColor: colors.cardBorder }}
          >
            <h3 className="font-['Barlow_Condensed'] text-xl font-bold mb-2" style={{ color: colors.text }}>Delete Report?</h3>
            <p className="font-['Barlow'] text-sm mb-6" style={{ color: colors.textMuted }}>
              This action cannot be undone. The report will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl py-3 font-['Barlow'] font-medium transition-colors"
                style={{ backgroundColor: colors.inputBg, color: colors.text }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading}
                className="flex-1 rounded-xl py-3 font-['Barlow'] font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#E74C3C", color: "#FFFFFF" }}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderColor: colors.cardBorder }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full font-['Barlow'] text-xs font-semibold"
                    style={{
                      backgroundColor: getClassificationStyle(selectedReport.classification).bg,
                      color: getClassificationStyle(selectedReport.classification).color,
                      borderWidth: "1px",
                      borderColor: getClassificationStyle(selectedReport.classification).border,
                    }}
                  >
                    {norm(selectedReport.classification) === "Urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {norm(selectedReport.classification)}
                  </span>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full font-['Barlow'] text-xs font-medium"
                    style={{
                      backgroundColor: getStatusStyle(selectedReport.status).bg,
                      color: getStatusStyle(selectedReport.status).color,
                    }}
                  >
                    {selectedReport.status}
                  </span>
                  {selectedReport.hasVideo && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-['Barlow'] text-xs" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" }}>
                      <Video className="h-3 w-3" /> Video
                    </span>
                  )}
                </div>
                <h2 className="font-['Barlow_Condensed'] text-2xl font-bold" style={{ color: colors.text }}>
                  {selectedReport.title}
                </h2>
                <p className="font-['Barlow'] text-sm mt-1" style={{ color: colors.textMuted }}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(selectedReport.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg transition-colors hover:bg-black/10"
                style={{ color: colors.textMuted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="font-['Barlow'] text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Summary
              </h3>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: colors.inputBg, borderWidth: "1px", borderColor: colors.cardBorder }}
              >
                <p className="font-['Barlow'] text-sm leading-relaxed whitespace-pre-wrap" style={{ color: colors.text }}>
                  {selectedReport.summary || "No summary available."}
                </p>
              </div>
            </div>

            {/* Transcript */}
            {selectedReport.transcript && (
              <div className="mb-6">
                <h3 className="font-['Barlow'] text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  🎤 Voice Transcript
                </h3>
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: colors.inputBg, borderWidth: "1px", borderColor: colors.cardBorder }}
                >
                  <p className="font-['Barlow'] text-sm leading-relaxed whitespace-pre-wrap" style={{ color: colors.text }}>
                    {selectedReport.transcript}
                  </p>
                </div>
              </div>
            )}

            {/* Video Analysis */}
            {selectedReport.videoAnalysis && (
              <div className="mb-6">
                <h3 className="font-['Barlow'] text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  📹 Video Analysis
                </h3>
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: colors.inputBg, borderWidth: "1px", borderColor: colors.cardBorder }}
                >
                  <p className="font-['Barlow'] text-sm leading-relaxed whitespace-pre-wrap" style={{ color: colors.text }}>
                    {selectedReport.videoAnalysis}
                  </p>
                </div>
              </div>
            )}

            {/* Report to Authorities Section */}
            <div className="mb-6">
              <h3 className="font-['Barlow'] text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2" style={{ color: colors.textMuted }}>
                <Phone className="h-4 w-4" />
                Report to Authorities
              </h3>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: colors.inputBg, borderWidth: "1px", borderColor: colors.cardBorder }}
              >
                {/* Dropdown */}
                <div className="relative mb-3">
                  <button
                    onClick={() => setShowAuthorityDropdown(!showAuthorityDropdown)}
                    className="w-full flex items-center justify-between rounded-lg px-4 py-3 font-['Barlow'] text-sm transition-colors"
                    style={{ 
                      backgroundColor: colors.cardBg, 
                      color: selectedAuthority ? colors.text : colors.textMuted,
                      borderWidth: "1px",
                      borderColor: showAuthorityDropdown ? "#F5C400" : colors.cardBorder
                    }}
                  >
                    <span>
                      {selectedAuthority 
                        ? emergencyContacts.find(c => c.id === selectedAuthority)?.name 
                        : "Select emergency service..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAuthorityDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showAuthorityDropdown && (
                    <div 
                      className="absolute z-10 w-full mt-2 rounded-xl overflow-hidden shadow-lg"
                      style={{ backgroundColor: colors.cardBg, borderWidth: "1px", borderColor: colors.cardBorder }}
                    >
                      {emergencyContacts.map((contact) => {
                        const isNotified = notifiedAuthorities[selectedReport?.id]?.[contact.id];
                        return (
                          <button
                            key={contact.id}
                            onClick={() => {
                              setSelectedAuthority(contact.id);
                              setShowAuthorityDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-black/5"
                            style={{ 
                              borderBottomWidth: "1px", 
                              borderColor: colors.cardBorder,
                            }}
                          >
                            <div>
                              <p className="font-['Barlow'] font-medium text-sm" style={{ color: colors.text }}>
                                {contact.name}
                              </p>
                              <p className="font-['Barlow'] text-xs" style={{ color: colors.textMuted }}>
                                {contact.description}
                              </p>
                            </div>
                            {isNotified && (
                              <span className="flex items-center gap-1 text-green-500">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Send Button */}
                {(() => {
                  const isNotified = selectedAuthority && notifiedAuthorities[selectedReport?.id]?.[selectedAuthority];
                  return (
                    <button
                      onClick={() => {
                        if (selectedAuthority && !isNotified) {
                          setNotifiedAuthorities(prev => ({
                            ...prev,
                            [selectedReport.id]: {
                              ...prev[selectedReport.id],
                              [selectedAuthority]: true
                            }
                          }));
                        }
                      }}
                      disabled={!selectedAuthority || isNotified}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-['Barlow'] font-semibold transition-all duration-300 ${
                        isNotified ? 'cursor-default' : !selectedAuthority ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      style={{ 
                        backgroundColor: isNotified ? "rgba(34, 197, 94, 0.2)" : "#F5C400",
                        color: isNotified ? "#22C55E" : "#000000",
                      }}
                    >
                      {isNotified ? (
                        <>
                          <Check className="h-5 w-5" />
                          Notified!
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Alert
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* Notified List */}
                {notifiedAuthorities[selectedReport?.id] && Object.keys(notifiedAuthorities[selectedReport?.id]).length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTopWidth: "1px", borderColor: colors.cardBorder }}>
                    <p className="font-['Barlow'] text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                      Authorities Notified:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(notifiedAuthorities[selectedReport.id]).map(authorityId => {
                        const contact = emergencyContacts.find(c => c.id === authorityId);
                        return (
                          <span
                            key={authorityId}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-['Barlow'] text-xs"
                            style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22C55E" }}
                          >
                            <Check className="h-3 w-3" />
                            {contact?.name?.split(' ')[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
              <button
                onClick={() => {
                  handleEdit(selectedReport);
                  setSelectedReport(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-['Barlow'] font-medium transition-colors"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" }}
              >
                <Edit3 className="h-4 w-4" />
                Edit Report
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(selectedReport.id);
                  setSelectedReport(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-['Barlow'] font-medium transition-colors"
                style={{ backgroundColor: "rgba(231, 76, 60, 0.15)", color: "#E74C3C" }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
