"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createVendorWithAccount } from "../actions";

export function CreateVendorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    name: string;
    slug: string;
    email: string;
    password: string;
    portalUrl: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState<"tiffin" | "water">("tiffin");
  const [upiId, setUpiId] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!credentials) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter or generate a password");
      return;
    }

    setLoading(true);
    try {
      const res = await createVendorWithAccount({
        name,
        slug,
        area,
        city,
        phone,
        email,
        password,
        businessType,
        upiId: upiId || undefined,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Vendor and login credentials created!");
      setCredentials(res.data);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text = `🎉 Welcome to RUXS!\n\nYour Merchant Portal is ready:\n🏪 Business: ${credentials.name}\n🔗 Login Portal: https://ruxs.in/sign-in\n👤 Login ID: ${credentials.email}\n🔑 Password: ${credentials.password}\n\nDirect Dashboard: https://ruxs.in${credentials.portalUrl}`;
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard!");
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setArea("");
    setCity("Bengaluru");
    setPhone("");
    setEmail("");
    setPassword("");
    setBusinessType("tiffin");
    setUpiId("");
    setCredentials(null);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setCredentials(null);
          if (!password) generatePassword();
        }}
        className="w-full py-3 px-4 bg-accent text-white font-medium text-sm rounded-[10px] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create New Vendor & Login Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-surface border border-line rounded-[16px] max-w-lg w-full p-6 shadow-xl my-8">
            {credentials ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">
                      Vendor Created & Activated!
                    </h3>
                    <p className="text-xs text-muted">
                      Give these login credentials to the merchant so they can log in.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFAF7] border border-line rounded-[12px] p-4 space-y-2.5 font-mono text-xs">
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-sans">
                      Business Name
                    </span>
                    <span className="text-ink font-semibold">{credentials.name}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-sans">
                      Login Email / ID
                    </span>
                    <span className="text-ink font-semibold select-all">
                      {credentials.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-sans">
                      Initial Password
                    </span>
                    <span className="text-ink font-semibold select-all">
                      {credentials.password}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-sans">
                      Merchant Portal URL
                    </span>
                    <span className="text-accent underline break-all select-all">
                      https://ruxs.in{credentials.portalUrl}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyCredentials}
                    className="flex-1 py-2.5 bg-accent text-white font-medium text-xs rounded-[8px] hover:opacity-90 active:scale-98 transition-all"
                  >
                    Copy All Credentials
                  </button>
                  <button
                    onClick={resetForm}
                    className="py-2.5 px-4 bg-[#FAFAF7] border border-line text-ink font-medium text-xs rounded-[8px] hover:bg-line/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      Create Merchant Account
                    </h3>
                    <p className="text-xs text-muted">
                      Creates vendor record and login credentials in one step.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-muted hover:text-ink text-sm p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-ink">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Sri Krishna Tiffin"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      placeholder="sri-krishna-tiffin"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">
                      Business Type *
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) =>
                        setBusinessType(e.target.value as "tiffin" | "water")
                      }
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent"
                    >
                      <option value="tiffin">Tiffin Service</option>
                      <option value="water">20L Water Supplier</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">Area *</label>
                    <input
                      type="text"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. HSR Layout Sector 2"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">
                      UPI ID (optional)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@okaxis"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-line pt-3 space-y-3">
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                    Merchant Login Credentials
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink">
                      Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@business.com"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-ink">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-[11px] text-accent hover:underline"
                      >
                        Generate Random
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-3 py-2 text-xs bg-bg border border-line rounded-[8px] focus:outline-none focus:border-accent font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 bg-[#FAFAF7] border border-line text-ink font-medium text-xs rounded-[8px] hover:bg-line/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-accent text-white font-medium text-xs rounded-[8px] hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create & Activate Vendor"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
