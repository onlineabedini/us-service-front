import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export interface BankDetailsType {
  accountHolder: string | null;
  bankName: string | null;
  accountNumber: string | null;
  IBAN: string | null;
  SWIFT: string | null;
}

interface BankDetailsSectionProps {
  bankDetails: BankDetailsType;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
}

const BankDetailsSection: React.FC<BankDetailsSectionProps> = memo(
  ({ bankDetails, onInputChange }) => {
    const { t } = useTranslation();

    return (
      <div className="flex flex-col gap-4 mb-6 mt-4">
        <h2 className="text-2xl font-semibold mb-2">{t("Bank Details")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Account Holder */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="accountHolder">{t("Account Holder")}*</Label>
            <Input
              id="accountHolder"
              value={bankDetails.accountHolder || ""}
              onChange={(e) => onInputChange(e, "accountHolder")}
              required
              placeholder={t("Enter account holder name")}
            />
          </div>

          {/* Bank Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="bankName">{t("Bank Name")}*</Label>
            <Input
              id="bankName"
              value={bankDetails.bankName || ""}
              onChange={(e) => onInputChange(e, "bankName")}
              required
              placeholder={t("Enter bank name")}
            />
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="accountNumber">{t("Account Number")}*</Label>
            <Input
              id="accountNumber"
              value={bankDetails.accountNumber || ""}
              onChange={(e) => onInputChange(e, "accountNumber")}
              required
              placeholder={t("Enter account number")}
            />
          </div>

          {/* IBAN */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="IBAN">{t("IBAN")}*</Label>
            <Input
              id="IBAN"
              value={bankDetails.IBAN || ""}
              onChange={(e) => onInputChange(e, "IBAN")}
              required
              placeholder={t("Enter IBAN")}
            />
          </div>

          {/* SWIFT */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="SWIFT">{t("SWIFT")}*</Label>
            <Input
              id="SWIFT"
              value={bankDetails.SWIFT || ""}
              onChange={(e) => onInputChange(e, "SWIFT")}
              required
              placeholder={t("Enter SWIFT code")}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default BankDetailsSection;