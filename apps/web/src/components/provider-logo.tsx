interface ProviderLogoProps {
  provider: string;
  className?: string;
  size?: number;
}

export function ProviderLogo({ provider, className = "", size = 28 }: ProviderLogoProps) {
  const p = provider.toLowerCase();

  if (p === "google_drive" || p === "google-drive" || p === "googledrive") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 87.3 78"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Google Drive"
      >
        <path
          d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
          fill="#0066DA"
        />
        <path
          d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z"
          fill="#00AC47"
        />
        <path
          d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z"
          fill="#EA4335"
        />
        <path
          d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"
          fill="#00832D"
        />
        <path
          d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
          fill="#2684FC"
        />
        <path
          d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z"
          fill="#FFBA00"
        />
      </svg>
    );
  }

  if (p === "dropbox") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        fill="#0061FE"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Dropbox"
      >
        <path d="M6 2L0 6.5 6 11l6-4.5L6 2zm12 0l-6 4.5 6 4.5 6-4.5L18 2zM0 15.5L6 20l6-4.5-6-4.5-6 4.5zm18-4.5l-6 4.5 6 4.5 6-4.5-6-4.5zM6 21.5l6-4.5 6 4.5-6 4.5-6-4.5z" />
      </svg>
    );
  }

  if (p === "onedrive") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Microsoft OneDrive"
      >
        <path
          d="M10.74 24.33H23.5a6.5 6.5 0 0 0 1.23-12.88 9 9 0 0 0-17.65 2.1 6.5 6.5 0 0 0 3.66 10.78Z"
          fill="#0364B8"
        />
        <path
          d="M19.78 24.33a5.5 5.5 0 0 0 5-3.23 6.5 6.5 0 0 0-3.66-10.78 8.97 8.97 0 0 0-8.87-2.65 9 9 0 0 1 7.25 8.66c0 .48-.04.95-.12 1.41a5.5 5.5 0 0 1 .4 6.59Z"
          fill="#0078D4"
        />
        <path
          d="M21.5 13.5a5.5 5.5 0 0 1 4.96 3.12A5 5 0 0 1 25.5 26h-14a5.5 5.5 0 0 1-5.46-4.88A6.5 6.5 0 0 1 10.74 13a6.45 6.45 0 0 1 1.76.25 9 9 0 0 1 9-0.75v1Z"
          fill="#1490DF"
        />
        <path
          d="M25.5 26h-14a5.5 5.5 0 0 1-5.46-4.88 5 5 0 0 0 4.7 3.88h14a4.99 4.99 0 0 0 4.74-3.41A5 5 0 0 1 25.5 26Z"
          fill="#28A8EA"
        />
      </svg>
    );
  }

  if (p === "mega") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MEGA"
      >
        <circle cx="24" cy="24" r="24" fill="#D9272E" />
        <path
          fill="#FFFFFF"
          d="M35 34h-4.2V22.8l-4.8 4.8c-1.2 1.2-2.8 1.2-4 0l-4.8-4.8V34H13V14h4.2l6.8 6.8 6.8-6.8H35v20Z"
        />
      </svg>
    );
  }

  if (p === "pcloud") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="pCloud"
      >
        <path
          d="M24.5 12.5a6.5 6.5 0 0 0-12.8-1.5A5.5 5.5 0 0 0 4 16.5C4 19.54 6.46 22 9.5 22h15c3.04 0 5.5-2.46 5.5-5.5a5.5 5.5 0 0 0-5.5-5.5v1.5Z"
          fill="#00A3E0"
        />
        <path
          d="M24.5 11a6.5 6.5 0 0 0-12.8-1.5A5.5 5.5 0 0 0 4 15c0 3.04 2.46 5.5 5.5 5.5h15c3.04 0 5.5-2.46 5.5-5.5a5.5 5.5 0 0 0-5.5-5.5v1.5Z"
          fill="#1EB7F0"
        />
        <path
          d="M14 13h4a3 3 0 0 1 0 6h-2v4h-2v-10Zm2 4h2a1 1 0 0 0 0-2h-2v2Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-700 ${className}`}
    >
      {provider.charAt(0).toUpperCase()}
    </div>
  );
}
