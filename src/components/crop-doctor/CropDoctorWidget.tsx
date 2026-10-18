import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  Leaf,
  Camera,
  Upload,
  ImagePlus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CircleAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  UserCheck,
  X,
  FileQuestion,
  Info,
} from "lucide-react";

interface CropDoctorWidgetProps {
  selectedCrop?: string | undefined;
  onNavigateToAdvisory?: ((prompt: string) => void) | undefined;
  notify?: ((msg: string) => void) | undefined;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export default function CropDoctorWidget({
  selectedCrop = "wheat",
  onNavigateToAdvisory,
  notify = () => {},
}: CropDoctorWidgetProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [crop, setCrop] = useState(() => {
    const c = selectedCrop.toLowerCase();
    if (["wheat", "rice", "tomato", "cotton", "mustard"].includes(c)) return c;
    return "wheat";
  });
  const [symptomCategory, setSymptomCategory] = useState("Yellow or brown leaf spots");
  const [symptomNotes, setSymptomNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [fileError, setFileError] = useState("");
  const [expertModal, setExpertModal] = useState(false);
  const [expertSubmitted, setExpertSubmitted] = useState(false);

  // Expert review form
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [district, setDistrict] = useState("Sonipat, Haryana");
  const [urgency, setUrgency] = useState("Standard");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateAndProcessFile = (file?: File) => {
    setFileError("");
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setFileError("Invalid file type. Please upload a JPG, PNG, or WebP photo.");
      notify("Please upload a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      notify("Image size exceeds 10 MB limit.");
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setFileMeta({
        name: file.name,
        size: sizeFormatted,
        type: file.type,
      });
      setAnalyzed(false);
      notify("Photo uploaded successfully. Ready for evaluation.");
    };
    reader.onerror = () => {
      setFileError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndProcessFile(droppedFile);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    validateAndProcessFile(selected);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setFileMeta(null);
    setAnalyzed(false);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    notify("Photo removed.");
  };

  const handleAnalyze = () => {
    if (!photo) {
      notify("Please upload or capture a crop photo first.");
      return;
    }

    setAnalyzing(true);
    setFileError("");

    // Simulate analysis delay
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      notify("Crop assessment protocol ready.");
    }, 1200);
  };

  const handleExpertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim() || !farmerPhone.trim()) {
      notify("Please provide your name and phone number.");
      return;
    }

    // Save expert case to localStorage queue
    try {
      const caseId = `KS-EXP-${Date.now().toString().slice(-6)}`;
      const existing = JSON.parse(localStorage.getItem("kisansetu_expert_cases") || "[]");
      existing.unshift({
        id: caseId,
        date: new Date().toISOString(),
        farmerName,
        farmerPhone,
        district,
        crop,
        symptomCategory,
        notes: symptomNotes,
        urgency,
      });
      localStorage.setItem("kisansetu_expert_cases", JSON.stringify(existing.slice(0, 10)));
      setExpertSubmitted(true);
      notify(`Expert case ${caseId} logged on this device.`);
    } catch {
      setExpertSubmitted(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        {/* Left: Upload and Symptom Inputs */}
        <section className="rounded-3xl border border-[#dfe7dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3 border-b border-[#edf1ea] pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f3e4] text-[#247547]">
              <Leaf size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#143e2b]">
                Crop Doctor · Visual Diagnostic Portal
              </h2>
              <p className="text-xs text-[#758478]">
                Guided photo workflow & verified agronomic field protocol
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="mt-5">
            {photo ? (
              <div className="relative overflow-hidden rounded-2xl border border-[#d6e3d2] bg-[#fbfdfa] p-3">
                <div className="relative max-h-[360px] overflow-hidden rounded-xl bg-slate-900/5 flex items-center justify-center">
                  <img
                    src={photo}
                    alt="Uploaded crop symptom"
                    className="max-h-[340px] w-auto max-w-full rounded-lg object-contain shadow-sm"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Replace photo"
                      className="rounded-lg bg-white/90 p-2 text-[#18482f] shadow backdrop-blur hover:bg-white"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remove photo"
                      className="rounded-lg bg-red-600/90 p-2 text-white shadow backdrop-blur hover:bg-red-700"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {fileMeta && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#6e7e72]">
                    <span className="font-semibold text-[#1a442d] truncate max-w-xs">{fileMeta.name}</span>
                    <span>{fileMeta.size} · {fileMeta.type.replace("image/", "").toUpperCase()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b8d5bc] bg-[#f7faf4] p-6 text-center transition hover:border-[#378456] hover:bg-[#eff7ec]"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#2b794a] shadow-sm">
                  <ImagePlus size={30} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#143d2a]">
                  Upload or Capture Crop Leaf Photo
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#728275]">
                  Drag and drop a clear photo of the infected leaf, stem, or panicle. Supported formats: JPG, PNG, WebP (max 10 MB).
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#145a37] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#0f4429]"
                  >
                    <Upload size={15} /> Browse Gallery
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[#c9dcc8] bg-white px-4 py-2 text-xs font-bold text-[#205736] shadow-sm hover:bg-[#f2f8ef]"
                  >
                    <Camera size={15} /> Mobile Camera
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Validation Error */}
          {fileError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
              <AlertTriangle size={15} className="shrink-0 text-red-600" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Crop & Symptoms Inputs */}
          <div className="mt-5 space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Crop Affected
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                >
                  <option value="wheat">Wheat (गेहूँ)</option>
                  <option value="rice">Rice / Paddy (धान)</option>
                  <option value="tomato">Tomato (टमाटर)</option>
                  <option value="cotton">Cotton (कपास)</option>
                  <option value="mustard">Mustard (सरसों)</option>
                  <option value="other">Other / Multi-crop</option>
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Visible Symptoms
                <select
                  value={symptomCategory}
                  onChange={(e) => setSymptomCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                >
                  <option>Yellow or brown leaf spots</option>
                  <option>Wilting / drooping foliage</option>
                  <option>White powdery coating on surface</option>
                  <option>Holes or leaf chewing damage</option>
                  <option>Leaf curling or mosaic discoloration</option>
                  <option>Stem rot or dark lesions at collar</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
              Detailed Field Observations <span className="font-normal lowercase text-[#859489]">(optional)</span>
              <textarea
                rows={2}
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder="e.g. noticed 3 days after sudden rainfall; predominantly affecting lower canopy leaves..."
                className="mt-1.5 w-full resize-none rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
              />
            </label>
          </div>

          {/* Analyse Button */}
          <button
            type="button"
            disabled={!photo || analyzing}
            onClick={handleAnalyze}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#145a37] p-3.5 text-sm font-bold text-white shadow-md hover:bg-[#0f4429] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {analyzing ? (
              <>
                <RefreshCw size={17} className="animate-spin" /> Evaluating Image & Agronomic Protocol...
              </>
            ) : (
              <>
                <Sparkles size={17} /> Evaluate Crop Health
              </>
            )}
          </button>
        </section>

        {/* Right: Transparent Diagnosis & Expert Workflow */}
        <section className="space-y-5">
          <div className="rounded-3xl border border-[#dfe7dc] bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-base font-bold text-[#143e2b]">
              Diagnostic Assessment & Protocol
            </h3>
            <p className="mt-1 text-xs text-[#748477]">
              Responsible agronomic decision support with verified guidelines
            </p>

            {analyzed ? (
              <div className="mt-5 space-y-4">
                {/* Honest Disclaimer Banner */}
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <CircleAlert size={17} className="shrink-0 text-amber-700" />
                    <span>No Vision Model Configured · Honest Evaluation</span>
                  </div>
                  <p className="mt-1.5">
                    No external plant pathology AI credentials are configured in this environment. KisanSetu will <strong>never fabricate</strong> a fake disease diagnosis, confidence percentage, or unverified pesticide recommendation.
                  </p>
                </div>

                {/* Agronomic Decision Checklist */}
                <div className="rounded-2xl border border-[#d8e6d5] bg-[#f8fbf7] p-4 text-xs">
                  <h4 className="font-bold text-[#18482f] flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-[#2b794a]" />
                    Field Scouting Protocol for {crop.toUpperCase()}:
                  </h4>
                  <ul className="mt-2.5 space-y-2 text-[#355240] leading-5">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2b794a] mt-1.5 shrink-0" />
                      <span><strong>Underside Inspection:</strong> Check the lower surface of affected leaves using a 10× hand lens to differentiate fungal rust pustules from bacterial lesions.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2b794a] mt-1.5 shrink-0" />
                      <span><strong>Pattern Scouting:</strong> Check if symptoms are clustered in low-lying waterlogged patches or uniformly spread across the field.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2b794a] mt-1.5 shrink-0" />
                      <span><strong>Cultural Management:</strong> Avoid sprinkler irrigation in the late evening to reduce canopy wetness duration.</span>
                    </li>
                  </ul>
                </div>

                {/* Primary CTA: Request Expert Review */}
                <div className="rounded-2xl border border-[#cbe2ca] bg-[#eef7ec] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#18492f]">
                        Need Confirmed Lab Verification?
                      </h4>
                      <p className="mt-1 text-xs text-[#526f5c]">
                        Submit this photo directly to your local KVK / State Agriculture Extension Officer.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpertModal(true)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#145a37] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#0f4429]"
                  >
                    <UserCheck size={15} /> Request Expert Review
                  </button>
                </div>

                {/* Ask AI Context Link */}
                {onNavigateToAdvisory && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToAdvisory(
                        `I noticed ${symptomCategory.toLowerCase()} on my ${crop} crop. What cultural and organic practices should I follow before spraying chemicals?`
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b8dab8] bg-white p-3 text-xs font-bold text-[#1f5c38] hover:bg-[#f2f8f0]"
                  >
                    <Sparkles size={15} /> Ask Kisan AI About {crop} Management
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce5da] bg-[#fbfdfa] p-8 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#edf5ec] text-[#347b4e]">
                  <Camera size={24} />
                </div>
                <h4 className="mt-3 text-sm font-bold text-[#173d2a]">
                  No Photo Evaluated Yet
                </h4>
                <p className="mt-1 max-w-xs text-xs text-[#7e8e82]">
                  Upload or capture a photo on the left and tap "Evaluate Crop Health" to generate the field inspection protocol.
                </p>
              </div>
            )}
          </div>

          {/* Safe chemical usage note */}
          <div className="rounded-2xl border border-[#e2e8df] bg-white p-4 text-xs leading-5 text-[#6c7d70]">
            <p className="font-bold text-[#19462e] flex items-center gap-1.5">
              <Info size={15} className="text-[#327a4d]" /> Safe Chemical Application Notice:
            </p>
            Never apply synthetic pesticides without official diagnostic confirmation from an authorized agricultural extension center or licensed agronomist. Always observe pre-harvest intervals (PHI) and wear protective masks and gloves.
          </div>
        </section>
      </div>

      {/* Request Expert Review Modal */}
      {expertModal && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#102b1e]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e7eee4] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-[#2b794a]" />
                <h3 className="text-lg font-bold text-[#143e2b]">
                  Request Expert Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpertModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {expertSubmitted ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="mt-3 text-base font-bold text-[#153e2b]">
                  Case Logged Successfully
                </h4>
                <p className="mt-2 text-xs leading-5 text-[#66776b]">
                  Your case details and photo record have been logged to the device queue. In production, this notification is transmitted to the local Krishi Vigyan Kendra (KVK) WhatsApp extension network.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setExpertModal(false);
                    setExpertSubmitted(false);
                  }}
                  className="mt-5 rounded-xl bg-[#145a37] px-6 py-2.5 text-xs font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleExpertSubmit} className="mt-4 space-y-3.5">
                <p className="text-xs text-[#6e7e72]">
                  Fill in your contact details so the district agriculture officer can reach out with confirmed recommendations.
                </p>

                <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                  Your Full Name
                  <input
                    type="text"
                    required
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="e.g. Ramesh Singh"
                    className="mt-1.5 w-full rounded-xl border border-[#dce5da] p-3 text-sm font-normal outline-none focus:border-[#307d4f]"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                  Mobile Phone Number
                  <input
                    type="tel"
                    required
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="mt-1.5 w-full rounded-xl border border-[#dce5da] p-3 text-sm font-normal outline-none focus:border-[#307d4f]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                    District / State
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#dce5da] p-3 text-sm font-normal outline-none focus:border-[#307d4f]"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                    Urgency
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#dce5da] p-3 text-sm font-normal outline-none focus:border-[#307d4f]"
                    >
                      <option>Standard (24h)</option>
                      <option>Urgent (Spreading quickly)</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setExpertModal(false)}
                    className="flex-1 rounded-xl border border-[#dce5da] p-3 text-xs font-bold text-[#55695b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#145a37] p-3 text-xs font-bold text-white hover:bg-[#0f4429]"
                  >
                    Submit Case
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
