import React, { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Camera,
  Save,
  Edit3,
  MapPin,
  Briefcase,
  Phone,
  Globe,
  Check,
  X,
  LogOut,
  Plus,
} from "lucide-react";

interface ProfileData {
  displayName: string;
  bio: string;
  company: string;
  position: string;
  location: string;
  phone: string;
  website: string;
}

interface ActivityItem {
  id: string;
  action: string;
  project: string;
  time: string;
  type: "create" | "share" | "update" | "delete";
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Claves únicas para localStorage basadas en el ID del usuario
  const storageKey = user?.sub ? `profile_${user.sub}` : null;
  const imageStorageKey = user?.sub ? `profile_image_${user.sub}` : null;
  const activitiesKey = user?.sub ? `activities_${user.sub}` : null;

  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: "",
    bio: "",
    company: "",
    position: "",
    location: "",
    phone: "",
    website: "",
  });

  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    displayName: "",
    bio: "",
    company: "",
    position: "",
    location: "",
    phone: "",
    website: "",
  });

  // Cargar datos del localStorage cuando el componente se monta
  useEffect(() => {
    if (user && storageKey) {
      // Cargar datos del perfil
      const savedProfile = localStorage.getItem(storageKey);
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          setProfileData(parsedProfile);
          setOriginalProfileData(parsedProfile);
        } catch (e) {
          console.error("Error al cargar perfil guardado:", e);
          const defaultData = {
            displayName: user?.name || "",
            bio: "",
            company: "",
            position: "",
            location: "",
            phone: "",
            website: "",
          };
          setProfileData(defaultData);
          setOriginalProfileData(defaultData);
        }
      } else {
        // Primera vez, usar datos del usuario de Auth0
        const defaultData = {
          displayName: user?.name || "",
          bio: "",
          company: "",
          position: "",
          location: "",
          phone: "",
          website: "",
        };
        setProfileData(defaultData);
        setOriginalProfileData(defaultData);
      }

      // Cargar imagen del perfil
      if (imageStorageKey) {
        const savedImage = localStorage.getItem(imageStorageKey);
        setProfileImage(savedImage || user?.picture || "");
      }

      // Cargar actividades
      if (activitiesKey) {
        const savedActivities = localStorage.getItem(activitiesKey);
        if (savedActivities) {
          try {
            setActivities(JSON.parse(savedActivities));
          } catch (e) {
            console.error("Error al cargar actividades:", e);
            setActivities(getDefaultActivities());
          }
        } else {
          setActivities(getDefaultActivities());
        }
      }
    }
  }, [user, storageKey, imageStorageKey, activitiesKey]);

  // Detectar cambios no guardados
  useEffect(() => {
    const hasChanges =
      JSON.stringify(profileData) !== JSON.stringify(originalProfileData);
    setHasUnsavedChanges(hasChanges && isEditing);
  }, [profileData, originalProfileData, isEditing]);

  const getDefaultActivities = (): ActivityItem[] => [
    {
      id: "1",
      action: "Creó un nuevo diagrama",
      project: "Infraestructura de Red",
      time: "Hace 2 horas",
      type: "create",
    },
    {
      id: "2",
      action: "Compartió proyecto",
      project: "Arquitectura DMZ",
      time: "Hace 1 día",
      type: "share",
    },
    {
      id: "3",
      action: "Actualizó configuración",
      project: "Seguridad Perimetral",
      time: "Hace 3 días",
      type: "update",
    },
    {
      id: "4",
      action: "Eliminó documento",
      project: "Pruebas de Penetración",
      time: "Hace 5 días",
      type: "delete",
    },
    {
      id: "5",
      action: "Creó nuevo proyecto",
      project: "Análisis de Vulnerabilidades",
      time: "Hace 1 semana",
      type: "create",
    },
  ];

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("error", "La imagen debe ser menor a 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);

        // Guardar imagen en localStorage inmediatamente
        if (imageStorageKey) {
          try {
            localStorage.setItem(imageStorageKey, result);
            showNotification("success", "Imagen actualizada correctamente");
          } catch (e) {
            showNotification(
              "error",
              "No se pudo guardar la imagen. Intenta con una imagen más pequeña."
            );
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (storageKey) {
      try {
        // Guardar en localStorage
        localStorage.setItem(storageKey, JSON.stringify(profileData));
        setOriginalProfileData(profileData);

        // Simular nueva actividad
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          action: "Actualizó su perfil",
          project: "Información Personal",
          time: "Hace un momento",
          type: "update",
        };

        const updatedActivities = [newActivity, ...activities.slice(0, 9)];
        setActivities(updatedActivities);

        if (activitiesKey) {
          localStorage.setItem(
            activitiesKey,
            JSON.stringify(updatedActivities)
          );
        }

        setIsEditing(false);
        setHasUnsavedChanges(false);
        showNotification("success", "Perfil actualizado correctamente");
      } catch (e) {
        showNotification("error", "Error al guardar los cambios");
        console.error("Error al guardar:", e);
      }
    }
  };

  const handleCancelEdit = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };


  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-32 w-32 rounded-full bg-white/10 mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-white/10 rounded mx-auto mb-2"></div>
            <div className="h-4 w-32 bg-white/10 rounded mx-auto"></div>
          </div>
          <p className="mt-4 text-white/60">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Navbar similar al de HomePage */}
      <nav className="border-b border-white/10 bg-[#0A0A0F]">
        <div className="mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="px-2 h-8 rounded bg-blue-600 flex items-center justify-center text-black font-bold">
                BHA
              </div>

              <span className="text-lg font-semibold">Black Hat Archetype</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/Board")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Documento
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors">
                <img
                  src={profileImage || user?.picture || "/placeholder.svg"}
                  alt={user?.name || "Usuario"}
                  className="h-8 w-8 rounded-full object-cover border border-white/20"
                />
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-[#141420] py-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </button>
                <button
                  onClick={() =>
                    logout({
                      logoutParams: { returnTo: window.location.origin },
                    })
                  }
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <p className="text-white/60 mt-2">
            Gestiona tu información personal.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 animate-slide-down rounded-xl p-4 backdrop-blur-sm ${
              notification.type === "success"
                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                : "bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === "success" ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <X className="h-5 w-5 text-red-400" />
              )}
              <span
                className={
                  notification.type === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }
              >
                {notification.message}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141420] to-[#1a1a28] p-6 backdrop-blur-sm">
                <div className="text-center">
                  <div className="relative mx-auto mb-4 h-36 w-36">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-20"></div>
                    <img
                      src={profileImage || "/placeholder.svg"}
                      alt={user?.name || "Usuario"}
                      className="relative h-full w-full rounded-full object-cover ring-4 ring-white/10"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2.5 text-white shadow-lg transition-all hover:scale-110"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <h2 className="text-2xl font-bold mb-1">
                    {profileData.displayName || user?.name}
                  </h2>
                  <p className="text-white/60 mb-2">{user?.email}</p>
                  {profileData.position && (
                    <p className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-medium">
                      {profileData.position}
                    </p>
                  )}

                  <div className="mt-6 space-y-3">
                    {profileData.company && (
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Briefcase className="h-4 w-4 text-blue-400" />
                        <span>{profileData.company}</span>
                      </div>
                    )}
                    {profileData.location && (
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span>{profileData.location}</span>
                      </div>
                    )}
                    {profileData.website && (
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Globe className="h-4 w-4 text-green-400" />
                        <a
                          href={profileData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors truncate"
                        >
                          {profileData.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    {profileData.phone && (
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Phone className="h-4 w-4 text-yellow-400" />
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información Personal */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-400" />
                  Información Personal
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      isEditing ? handleCancelEdit() : setIsEditing(true)
                    }
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 text-sm border border-white/10 transition-all hover:bg-white/10"
                  >
                    <Edit3 className="h-4 w-4" />
                    {isEditing ? "Cancelar" : "Editar"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141420] to-[#1a1a28] p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) =>
                        handleFieldChange("displayName", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white/60 opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) =>
                        handleFieldChange("company", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="Nombre de tu empresa"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Posición
                    </label>
                    <input
                      type="text"
                      value={profileData.position}
                      onChange={(e) =>
                        handleFieldChange("position", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="Tu cargo o posición"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) =>
                        handleFieldChange("location", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="Ciudad, País"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) =>
                        handleFieldChange("website", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="https://tuempresa.com"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Cuéntanos sobre ti y tu experiencia en ciberseguridad..."
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 disabled:opacity-60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                  />
                </div>

                {isEditing && hasUnsavedChanges && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/5"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}