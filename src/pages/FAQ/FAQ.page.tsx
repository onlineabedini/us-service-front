import React from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQPage: React.FC = () => {
  const { t } = useTranslation();

  // FAQ items for the FAQ page (provider-specific)
  const faqItems = [
    {
      question: "How do I get started?",
      answer: "To get started, simply pre-register or sign up as a provider, complete your profile, and follow the onboarding steps. Once approved, you can begin accepting jobs and managing your schedule."
    },
    {
      question: "Who can register as a service provider on Vitago?",
      answer: "Anyone who wants the freedom to choose when, where, and with whom they work. You must have the legal right to work in Sweden."
    },
    {
      question: "Is there a minimum number of hours I need to work?",
      answer: "No. With Vitago, you decide when and how much you want to work. There are no minimum hours — it's completely up to you. Work full-time, part-time, or just occasionally — your schedule, your choice."
    },
    {
      question: "Who sets the price for an assignment?",
      answer: "You decide your own price in agreement with the customer."
    },
    {
      question: "How do I get paid?",
      answer: "Your compensation is paid on a monthly basis via SamEkonomi after the customer approves the completed assignment. Taxes and fees are handled by them. Use our calculator to see an estimation of your monthly compensation."
    },
    {
      question: "What happens if the customer is not satisfied?",
      answer: "Any disputes must be resolved directly between you and the customer. Vitago is not a party to the agreement."
    },
    {
      question: "Am I employed by Vitago?",
      answer: "No, you are an independent contractor and are responsible for scheduling, service delivery, and communication with your clients. SamEkonomi will handle your taxes."
    },
    {
      question: "Can I close my account at any time?",
      answer: "Yes, you can close your account at any time. Ongoing assignments should be completed or resolved with the customer before termination."
    },
    {
      question: "What is the pilot program and how can I join?",
      answer: "The pilot program gives early access to new features and exclusive benefits. You can join by selecting the pilot option during registration or in your account settings. Participation is voluntary and helps us improve the platform."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-teal-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400">
          {t("faq.title", "Frequently Asked Questions")}
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          {t(
            "faq.description",
            "Find answers to common questions about our cleaning services."
          )}
        </p>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-left font-medium text-gray-900">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-gray-600">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <Footer />
    </div>
  );
};

export default FAQPage;