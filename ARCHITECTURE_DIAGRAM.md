# Ryoko AI Trip Planner - Architecture Diagram

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[React Web App<br/>TypeScript + Vite]
        Creator[Plan Creator]
        Member[Team Member]
    end

    subgraph "Google Cloud Run"
        CloudRun[Cloud Run Service<br/>nginx + Static Files]
    end

    subgraph "Firebase Services"
        Auth[Firebase Authentication]
        Firestore[(Firestore Database)]
        subgraph "Collections"
            Users[(users)]
            Plans[(plans)]
            Members[(members)]
        end
    end

    subgraph "Google AI Services"
        Gemini[Gemini 2.5 Pro API]
        MapsGrounding[Google Maps Grounding]
        SearchGrounding[Google Search Grounding]
    end

    subgraph "Google Maps Services"
        MapsJS[Google Maps JavaScript API]
        PlacesAPI[Google Places API]
        StaticMaps[Google Static Maps API]
        Geocoding[Google Geocoding API]
    end

    %% User interactions
    Creator -->|Create Account/Login| Auth
    Member -->|Join with Invite Code| WebApp
    Creator -->|Create Plan| WebApp
    Member -->|Add Preferences| WebApp

    %% Frontend to Cloud Run
    WebApp -->|Served via| CloudRun

    %% Frontend to Firebase
    WebApp -->|Authenticate| Auth
    WebApp -->|Read/Write| Firestore
    Auth -->|User Data| Users
    Firestore -->|Plan Data| Plans
    Firestore -->|Member Data| Members

    %% Itinerary Generation Flow
    WebApp -->|Generate Itinerary Request| Gemini
    Gemini -->|Search for Places| SearchGrounding
    Gemini -->|Get Location Details| MapsGrounding
    MapsGrounding -->|Return URIs & Data| Gemini
    SearchGrounding -->|Return Place Info| Gemini
    Gemini -->|JSON Itinerary + Sources| WebApp

    %% Maps Integration
    WebApp -->|Load Maps| MapsJS
    WebApp -->|Get Place Photos| PlacesAPI
    WebApp -->|Get Static Images| StaticMaps
    WebApp -->|Geocode Locations| Geocoding
    MapsGrounding -->|Place URIs| WebApp

    %% Data Flow
    WebApp -->|Save Itinerary| Plans
    WebApp -->|Save Member Data| Members
    WebApp -->|Real-time Updates| Firestore

    style WebApp fill:#4F46E5,stroke:#312E81,color:#fff
    style CloudRun fill:#34D399,stroke:#065F46,color:#fff
    style Auth fill:#F59E0B,stroke:#92400E,color:#fff
    style Firestore fill:#F59E0B,stroke:#92400E,color:#fff
    style Gemini fill:#8B5CF6,stroke:#5B21B6,color:#fff
    style MapsGrounding fill:#3B82F6,stroke:#1E40AF,color:#fff
    style SearchGrounding fill:#3B82F6,stroke:#1E40AF,color:#fff
    style MapsJS fill:#10B981,stroke:#047857,color:#fff
    style PlacesAPI fill:#10B981,stroke:#047857,color:#fff
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant Creator
    participant Member
    participant WebApp
    participant Firebase
    participant Gemini
    participant MapsAPI

    Note over Creator,Member: Plan Creation Flow
    Creator->>WebApp: Register/Login
    WebApp->>Firebase: Authenticate
    Firebase-->>WebApp: Auth Token
    Creator->>WebApp: Create Plan
    WebApp->>Firebase: Save Plan + Generate Invite Code
    Firebase-->>WebApp: Plan Created

    Note over Creator,Member: Member Joining Flow
    Member->>WebApp: Enter Invite Code
    WebApp->>Firebase: Verify Invite Code
    Firebase-->>WebApp: Plan Found
    Member->>WebApp: Set Passcode + Add Preferences
    WebApp->>Firebase: Create Member + Aggregate Preferences
    Firebase-->>WebApp: Member Created

    Note over Creator,Member: Itinerary Generation Flow
    Creator->>WebApp: Click "Generate Itinerary"
    WebApp->>Firebase: Get Aggregated Preferences
    Firebase-->>WebApp: Group Vibe, Must-Dos, Vetos
    WebApp->>Gemini: Generate Itinerary Request
    Gemini->>Gemini: Use Google Search Grounding
    Gemini->>Gemini: Use Google Maps Grounding
    Gemini-->>WebApp: JSON Itinerary + Grounding Sources
    WebApp->>WebApp: Match Sources to Itinerary Items
    WebApp->>Firebase: Save Itinerary + Sources
    Firebase-->>WebApp: Saved
    WebApp-->>Creator: Display Itinerary

    Note over Creator,Member: Location Image Loading
    WebApp->>MapsAPI: Get Place Photo (Place ID/CID)
    MapsAPI-->>WebApp: Place Photo URL
    WebApp-->>Member: Display with Photo
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ PLANS : creates
    PLANS ||--o{ MEMBERS : has
    
    USERS {
        string id PK
        string email
        string name
        timestamp createdAt
    }
    
    PLANS {
        string id PK
        string creatorId FK
        string destination
        string tripDates
        string inviteCode
        string status
        string groupVibe
        string mustDoList
        string vetoList
        object itinerary
        array sources
        array memberIds
        timestamp createdAt
        timestamp updatedAt
    }
    
    MEMBERS {
        string id PK
        string planId FK
        string name
        string passcodeHash
        boolean hasAccount
        object preferences
        timestamp joinedAt
    }
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        App[App.tsx<br/>Router]
        Landing[LandingPage]
        Auth[Login/Register]
        CreatePlan[CreatePlan]
        PlanDashboard[PlanDashboard]
        JoinPlan[JoinPlan]
        ItineraryDisplay[ItineraryDisplay]
        ExpandableCard[ExpandableCard]
    end

    subgraph "Services"
        GeminiService[geminiService.ts]
        FirebaseAuth[auth.ts]
        FirebasePlans[plans.ts]
        FirebaseMembers[members.ts]
    end

    subgraph "Utils"
        MatchSources[matchSources.ts]
        GetLocationImage[getLocationImage.ts]
        GetPlacePhoto[getPlacePhoto.ts]
        ExtractCoords[extractCoordinates.ts]
        AggregatePrefs[aggregatePreferences.ts]
    end

    App --> Landing
    App --> Auth
    App --> CreatePlan
    App --> PlanDashboard
    App --> JoinPlan
    
    PlanDashboard --> ItineraryDisplay
    ItineraryDisplay --> ExpandableCard
    
    PlanDashboard --> GeminiService
    PlanDashboard --> FirebasePlans
    PlanDashboard --> FirebaseMembers
    
    JoinPlan --> FirebaseAuth
    JoinPlan --> FirebaseMembers
    
    CreatePlan --> FirebasePlans
    
    ItineraryDisplay --> MatchSources
    ExpandableCard --> GetLocationImage
    GetLocationImage --> GetPlacePhoto
    GetPlacePhoto --> ExtractCoords
    
    FirebasePlans --> AggregatePrefs
    FirebaseMembers --> AggregatePrefs

    style App fill:#4F46E5,stroke:#312E81,color:#fff
    style GeminiService fill:#8B5CF6,stroke:#5B21B6,color:#fff
    style FirebaseAuth fill:#F59E0B,stroke:#92400E,color:#fff
    style FirebasePlans fill:#F59E0B,stroke:#92400E,color:#fff
    style FirebaseMembers fill:#F59E0B,stroke:#92400E,color:#fff
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        LocalDev[Local Development<br/>npm run dev]
    end

    subgraph "Build Process"
        DockerBuild[Docker Build<br/>Multi-stage]
        BuildStage[Build Stage<br/>Node.js + npm]
        ProdStage[Production Stage<br/>nginx Alpine]
    end

    subgraph "Google Cloud"
        CloudBuild[Cloud Build<br/>CI/CD]
        ContainerRegistry[Container Registry<br/>gcr.io]
        CloudRun[Cloud Run<br/>Managed Service]
    end

    subgraph "External Services"
        Firebase[Firebase]
        GeminiAPI[Gemini API]
        MapsAPI[Google Maps APIs]
    end

    LocalDev -->|Test| DockerBuild
    DockerBuild --> BuildStage
    BuildStage -->|Build React App| ProdStage
    ProdStage -->|Create Image| ContainerRegistry
    
    CloudBuild -->|Trigger| DockerBuild
    CloudBuild -->|Push| ContainerRegistry
    ContainerRegistry -->|Deploy| CloudRun
    
    CloudRun -->|API Calls| GeminiAPI
    CloudRun -->|API Calls| MapsAPI
    CloudRun -->|Database| Firebase

    style CloudRun fill:#34D399,stroke:#065F46,color:#fff
    style CloudBuild fill:#3B82F6,stroke:#1E40AF,color:#fff
    style ContainerRegistry fill:#3B82F6,stroke:#1E40AF,color:#fff
    style Firebase fill:#F59E0B,stroke:#92400E,color:#fff
    style GeminiAPI fill:#8B5CF6,stroke:#5B21B6,color:#fff
    style MapsAPI fill:#10B981,stroke:#047857,color:#fff
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Firebase
    participant Firestore

    Note over User,Firestore: Creator Authentication
    User->>WebApp: Register/Login
    WebApp->>Firebase: Authenticate
    Firebase-->>WebApp: Auth Token + User ID
    WebApp->>Firestore: Create/Update User Document
    Firestore-->>WebApp: User Created

    Note over User,Firestore: Member Authentication (No Account)
    User->>WebApp: Enter Invite Code
    WebApp->>Firestore: Query Plan by Invite Code
    Firestore-->>WebApp: Plan Found
    User->>WebApp: Select Name or Create New
    User->>WebApp: Set/Enter Passcode
    WebApp->>WebApp: Hash Passcode (bcrypt)
    WebApp->>Firestore: Create Member with Hashed Passcode
    Firestore-->>WebApp: Member Created
    WebApp->>WebApp: Store userCode in localStorage
```

## Itinerary Generation Flow

```mermaid
flowchart TD
    Start[User Clicks Generate] --> GetPrefs[Get Aggregated Preferences]
    GetPrefs --> BuildPrompt[Build Prompt with Preferences]
    BuildPrompt --> CallGemini[Call Gemini API]
    CallGemini --> UseSearch[Use Google Search Grounding]
    UseSearch --> UseMaps[Use Google Maps Grounding]
    UseMaps --> GetURIs[Extract URIs from Grounding]
    GetURIs --> ParseJSON[Parse JSON Response]
    ParseJSON --> MatchSources[Match Sources to Itinerary]
    MatchSources --> SavePlan[Save to Firestore]
    SavePlan --> Display[Display Itinerary]
    Display --> LoadImages[Load Place Photos]
    LoadImages --> End[Complete]

    CallGemini -->|Error| Retry{Retry?}
    Retry -->|Yes| CallGemini
    Retry -->|No| Error[Show Error]
```

