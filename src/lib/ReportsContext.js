"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "./supabase";

const ReportsContext = createContext(null);

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reports from Supabase on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map database fields to frontend format
      const mappedData = (data || []).map((report) => ({
        id: report.id,
        date: report.created_at,
        title: report.title,
        classification: report.classification,
        confidence: report.confidence,
        summary: report.summary,
        status: report.status,
        hasVideo: report.has_video,
        transcript: report.transcript,
        videoAnalysis: report.video_analysis,
      }));
      
      setReports(mappedData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const addReport = useCallback(async (report) => {
    try {
      const newReport = {
        title: report.title || "Emergency Alert",
        classification: report.classification || "Pending",
        confidence: report.confidence || "Medium",
        summary: report.summary || "",
        status: "Pending",
        has_video: report.hasVideo || false,
      };

      const { data, error } = await supabase
        .from("reports")
        .insert([newReport])
        .select()
        .single();

      if (error) throw error;

      const mappedReport = {
        id: data.id,
        date: data.created_at,
        title: data.title,
        classification: data.classification,
        confidence: data.confidence,
        summary: data.summary,
        status: data.status,
        hasVideo: data.has_video,
      };

      setReports((prev) => [mappedReport, ...prev]);
      return mappedReport;
    } catch (error) {
      console.error("Error adding report:", error);
      throw error;
    }
  }, []);

  const updateReport = useCallback(async (id, updates) => {
    try {
      const dbUpdates = {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.classification !== undefined && { classification: updates.classification }),
        ...(updates.confidence !== undefined && { confidence: updates.confidence }),
        ...(updates.summary !== undefined && { summary: updates.summary }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.hasVideo !== undefined && { has_video: updates.hasVideo }),
      };

      const { data, error } = await supabase
        .from("reports")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setReports((prev) =>
        prev.map((report) =>
          report.id === id
            ? {
                ...report,
                title: data.title,
                classification: data.classification,
                confidence: data.confidence,
                summary: data.summary,
                status: data.status,
                hasVideo: data.has_video,
              }
            : report
        )
      );

      return data;
    } catch (error) {
      console.error("Error updating report:", error);
      throw error;
    }
  }, []);

  const deleteReport = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReports((prev) => prev.filter((report) => report.id !== id));
    } catch (error) {
      console.error("Error deleting report:", error);
      throw error;
    }
  }, []);

  const getReportById = useCallback((id) => {
    return reports.find((report) => report.id === id);
  }, [reports]);

  return (
    <ReportsContext.Provider
      value={{
        reports,
        loading,
        fetchReports,
        addReport,
        updateReport,
        deleteReport,
        getReportById,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
}
