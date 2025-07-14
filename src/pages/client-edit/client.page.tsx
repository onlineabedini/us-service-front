// READ-ONLY MODE: All fields are disabled for preview purposes
//@collapse
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// Layout Components
// import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

// Separated Sections
import HeaderActions from "./sections/HeaderActions";
import ClientSidebar from "./sections/ClientSidebar";
import ClientBasicInfo from "./sections/ClientBasicInfo";
import ClientAddressSection from "./sections/ClientAddressSection";
import MainAddressSection from "./sections/MainAddressSection";
import DescriptionField from "./sections/DescriptionField";
import HomeDetails from "./sections/HomeDetails";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


import { API_BASE_URL } from '@/config/api';

const baseUrl: string = API_BASE_URL;

// 1) Define the exact address shape from your backend
interface ClientAddress {
  country: string;
  city: string;
  streetAddress: string;
  streetName: string;
  houseNumber: number;
  floor: number;
  postalCode: string;
  doorCode: string;
  doorPhone: number;
  size: number;
  typeOfLiving: string;
  numberOfRooms: number;
}

// 2) Update your ClientData to include this address type
interface ClientData {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: ClientAddress[];
  description?: string;
  pets?: string;
  languages?: string;
  adminNotes?: string;
  profileImage?: string | null;
  createdAt?: string;
  [key: string]: any;
}

interface ValidationErrors {
  [key: string]: string;
}

function ClientEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  // =============== STATE ===============
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    "/src/assets/img/provider.jpg"
  );
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Track validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // =============== DATA FETCHING ===============
  const fetchClientData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/client/${id}`);
      if (!res.ok) {
        throw new Error(t("failedToLoadClientData"));
      }
      const data: ClientData = await res.json();

      if (data.profileImage) {
        setImagePreview(`${baseUrl}/${data.profileImage}`);
      }
      setClientData(data);
    } catch (error) {
      toast.error(t("failedToLoadClientData"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  // =============== VALIDATION LOGIC ===============
  const validateField = useCallback(
    (fieldName: string, value: any) => {
      let errorMsg = "";

      switch (fieldName) {
        case "email":
          if (value && !/^\S+@\S+\.\S+$/.test(value)) {
            errorMsg = t("invalidEmail") || "Invalid email format.";
          }
          break;
        case "phoneNumber":
          if (value && !/^[0-9]{7,15}$/.test(value)) {
            errorMsg =
              t("invalidPhoneNumber") ||
              "Phone number must be 7-15 digits.";
          }
          break;
        case "username":
          if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
            errorMsg =
              t("invalidUsername") ||
              "Username can only contain letters, numbers, underscores.";
          }
          break;
        default:
          break;
      }

      return errorMsg;
    },
    [t]
  );

  // =============== HANDLERS ===============
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!clientData) return;

      const { id: fieldName, value } = e.target;
      let newValue: any = value;

      if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
        newValue = e.target.checked;
      }

      // Validate the field
      const errorMsg = validateField(fieldName, newValue);

      // Update error state
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: errorMsg,
      }));

      // Update client data
      setClientData((prev) => (prev ? { ...prev, [fieldName]: newValue } : null));
    },
    [clientData, validateField]
  );

  // 3) Make sure to convert numeric fields to numbers for addresses
  const handleAddressInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      index: number,
      nestedKey: keyof ClientAddress
    ) => {
      if (!clientData) return;
      const newAddress = [...(clientData.address || [])];

      // If the field is numeric, convert to number
      // (Adjust logic if you prefer to store them as strings)
      const numericFields: (keyof ClientAddress)[] = [
        "houseNumber",
        "floor",
        "doorPhone",
        "size",
        "numberOfRooms",
      ];

      newAddress[index] = {
        ...newAddress[index],
        [nestedKey]: numericFields.includes(nestedKey)
          ? Number(e.target.value)
          : e.target.value,
      };

      setClientData({ ...clientData, address: newAddress });
    },
    [clientData]
  );

  // 4) Create a new empty address matching your backend schema
  const handleAddAddress = useCallback(() => {
    if (!clientData) return;
    const newAddress: ClientAddress = {
      country: "",
      city: "",
      streetAddress: "",
      streetName: "",
      houseNumber: 0,
      floor: 0,
      postalCode: "",
      doorCode: "",
      doorPhone: 0,
      size: 0,
      typeOfLiving: "",
      numberOfRooms: 0,
    };

    setClientData({
      ...clientData,
      address: [...(clientData.address || []), newAddress],
    });
  }, [clientData]);

  const handleProfileImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setProfileFile(file);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setImagePreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!clientData) return;

    // Check for validation errors before saving
    const hasErrors = Object.values(validationErrors).some((msg) => msg !== "");
    if (hasErrors) {
      toast.error(
        t("pleaseFixErrors") || "Please fix validation errors before saving."
      );
      return;
    }

    try {
      setLoading(true);

      // If there's a new profile image, upload it first
      if (profileFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("profileImage", profileFile);
        const uploadResponse = await fetch(
          `${baseUrl}/client/${clientData.id}/upload-profile`,
          {
            method: "POST",
            body: uploadFormData,
          }
        );
        if (!uploadResponse.ok) {
          throw new Error(t("failedToUpdateClient"));
        }
      }

      // Prepare payload by excluding fields you don't want to update
      const { id: _, profileImage, createdAt, ...updatePayload } = clientData;

      const updateResponse = await fetch(`${baseUrl}/client/${clientData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!updateResponse.ok) {
        throw new Error(t("failedToUpdateClient"));
      }

      toast.success(t("clientUpdatedSuccess"), {
        description: t("clientUpdatedSuccessDesc"),
      });
      // Refresh client data
      await fetchClientData();
    } catch (error) {
      toast.error(t("failedToUpdateClient"));
    } finally {
      setLoading(false);
    }
  }, [clientData, profileFile, fetchClientData, t, validationErrors]);

  // =============== RENDER ===============
  if (loading && !clientData) {
    return <div className="text-center p-10">{t("loadingClientData")}</div>;
  }

  if (!clientData) {
    return <div className="text-center p-10">{t("noClientDataFound")}</div>;
  }

  return (
    <>
      {/* <Navbar /> */}
      <div className="container mx-auto p-6 max-w-7xl">
        <Separator className="my-4" />
        <HeaderActions onSave={handleSave} loading={loading} readOnlyMode={true} />
        <div className="flex flex-col lg:flex-row gap-8">
          <ClientSidebar
            imagePreview={imagePreview}
            username={clientData.username}
            onProfileImageChange={handleProfileImageChange}
            readOnlyMode={true}
          />
          <div className="lg:w-4/5 flex flex-col gap-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t("basicDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientBasicInfo
                  clientData={clientData}
                  onInputChange={handleInputChange}
                  validationErrors={validationErrors}
                  readOnlyMode={true}
                />

                {/* main address */}
                <MainAddressSection
                  addresses={clientData.address}
                  onAddressInputChange={handleAddressInputChange}
                  readOnlyMode={true}
                />

              </CardContent>
            </Card>
            <Separator className="my-4" />

            {/* dscription */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t("Description")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Description */}
                <DescriptionField
                  description={clientData.description || ""}
                  onChange={handleInputChange}
                  readOnlyMode={true}
                />
              </CardContent>
            </Card>
            <Separator className="my-4" />

            {/* Home details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t("homeDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <HomeDetails
                  addresses={clientData.address}
                  onAddressInputChange={handleAddressInputChange}
                  readOnlyMode={true}
                />

              </CardContent>
            </Card>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave} disabled={true}>
            Read Only Mode
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ClientEditPage;
