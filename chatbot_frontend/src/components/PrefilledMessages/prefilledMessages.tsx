import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { MessageType } from "@/redux";

interface PrefilledMessagesProps {
  onPrefilledMessage: (message: string, type: MessageType) => void;
}

interface BackendQuestion {
  question: string;
  type: MessageType;
}

const PrefilledMessages = ({ onPrefilledMessage }: PrefilledMessagesProps) => {
  // 1️⃣ Static fallback questions
  const staticMessages: BackendQuestion[] = useMemo(
    () => [
      {
        question:
          "Give me a financial report on revenue breakdown of Six Flags for Q4 2024?",
        type: "text",
      },
      {
        question:
          "Which ride in Six Flags has the highest average monthly attendance in 2024?",
        type: "text",
      },
      {
        question: "How much is the %change in payroll cost from 2023 to 2024?",
        type: "text",
      },
      {
        question:
          "Which event has brought the highest revenue in Six Flags and Aquarabia?",
        type: "text",
      },
      {
        question:
          "How many safety incidents were reported in Six Flags in October 2024?",
        type: "text",
      },
      {
        question:
          "Provide a tabular report on total labour hours for Six Flags and Aquarabia in December 2024?",
        type: "text",
      },
    ],
    []
  );

  // 2️⃣ State for dynamic questions
  const [questions, setQuestions] = useState<BackendQuestion[]>(staticMessages);
  const [loading, setLoading] = useState(false);

  // 3️⃣ Fetch questions with 2-second timeout
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const user_id = "nvalappil";

      // Helper: timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout after 1 seconds")), 1000)
      );

      // Backend fetch promise
      const fetchPromise = fetch(
        "https://rawa-agent1-1060681624080.us-central1.run.app/api/chat/v1/prefilled",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id }),
        }
      );

      try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (
          data?.questions &&
          Array.isArray(data.questions) &&
          data.questions.length > 0
        ) {
          setQuestions(data.questions.slice(0, 6));
        } else {
          console.warn("⚠️ Invalid data — using static fallback.");
          setQuestions(staticMessages);
        }
      } catch (error) {
        console.error("❌ Using static fallback due to error/timeout:", error);
        setQuestions(staticMessages);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [staticMessages]);

  // 4️⃣ Render
  return (
    <div className="mb-8 grid grid-cols-3 gap-7">
      {loading ? (
        <div className="col-span-3 text-center text-gray-500">
          Loading questions...
        </div>
      ) : (
        questions.map((message) => (
          <Card
            onClick={() => onPrefilledMessage(message.question, message.type)}
            key={message.question}
            className="cursor-pointer rounded-[12px] shadow-none transition-all duration-300 hover:bg-gray-100"
          >
            <CardContent className="p-2">
              <div className="font-['Proxima Nova'] text-sm font-semibold text-[#001b72]">
                {message.question}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export { PrefilledMessages };
