# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                     │
│                                                                             │
│  ┌──────────────────────┐              ┌─────────────────────────────┐    │
│  │   Web Interface      │              │   API Clients               │    │
│  │   (index.html)       │              │   (SDK, cURL, etc.)        │    │
│  │                      │              │                             │    │
│  │  • Visual Preview    │              │  • Programmatic Access     │    │
│  │  • User Interaction  │              │  • Integration Points      │    │
│  │  • Biometric Prompt  │              │  • Custom Workflows        │    │
│  └──────────┬───────────┘              └──────────┬──────────────────┘    │
│             │                                      │                       │
└─────────────┼──────────────────────────────────────┼───────────────────────┘
              │                                      │
              └──────────────────┬───────────────────┘
                                 │
                                 │ HTTPS
                                 │
┌─────────────────────────────────┴───────────────────────────────────────────┐
│                            API LAYER                                        │
│                         (Express Server)                                    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        REST API Endpoints                            │  │
│  │                                                                      │  │
│  │  POST /api/sandbox/create        - Create new sandbox              │  │
│  │  POST /api/sandbox/:id/simulate  - Simulate action                 │  │
│  │  POST /api/auth/challenge        - Create auth challenge           │  │
│  │  POST /api/sandbox/:id/execute   - Execute verified action         │  │
│  │  POST /api/sandbox/:id/cancel    - Cancel sandbox                  │  │
│  │  GET  /api/audit                 - Retrieve audit logs             │  │
│  │  GET  /api/health                - Health check                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────┐                      ┌─────────────────────────┐  │
│  │   Middleware       │                      │   Security Layer        │  │
│  │                    │                      │                         │  │
│  │  • CORS            │                      │  • Rate Limiting        │  │
│  │  • Body Parser     │                      │  • Input Validation     │  │
│  │  • Error Handler   │                      │  • Authentication       │  │
│  └────────────────────┘                      └─────────────────────────┘  │
└─────────────┬───────────────────────────────────────┬─────────────────────┘
              │                                       │
              │                                       │
┌─────────────┴───────────────────┐   ┌──────────────┴──────────────────────┐
│    BUSINESS LOGIC LAYER         │   │    AUTHENTICATION LAYER             │
│                                 │   │                                     │
│  ┌──────────────────────────┐  │   │  ┌──────────────────────────────┐  │
│  │  SandboxManager          │  │   │  │  BiometricAuth               │  │
│  │                          │  │   │  │                              │  │
│  │  • createSandbox()       │  │   │  │  • createChallenge()         │  │
│  │  • simulateAction()      │  │   │  │  • verifyResponse()          │  │
│  │  • executeAction()       │  │   │  │  • checkAvailability()       │  │
│  │  • cancelSandbox()       │  │   │  │  • clearExpired()            │  │
│  │  • getAuditLog()         │  │   │  │                              │  │
│  │                          │  │   │  │  Supported Methods:          │  │
│  │  State Management:       │  │   │  │  • WebAuthn (Biometric)     │  │
│  │  • activeSandboxes Map   │  │   │  │  • PIN Fallback             │  │
│  │  • auditLog Array        │  │   │  │                              │  │
│  └───────────┬──────────────┘  │   │  └──────────────────────────────┘  │
│              │                  │   │                                     │
└──────────────┼──────────────────┘   └─────────────────────────────────────┘
               │
               │
┌──────────────┴──────────────────────────────────────────────────────────────┐
│                         EXECUTION LAYER                                     │
│                      (Browser Automation)                                   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Puppeteer                                    │  │
│  │                                                                      │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │  │
│  │  │  Sandbox Instance  │  │  Sandbox Instance  │  │     ...      │ │  │
│  │  │                    │  │                    │  │              │ │  │
│  │  │  • Browser Process │  │  • Browser Process │  │              │ │  │
│  │  │  • Page Context    │  │  • Page Context    │  │              │ │  │
│  │  │  • Screenshot Cap. │  │  • Screenshot Cap. │  │              │ │  │
│  │  │  • DOM Interaction │  │  • DOM Interaction │  │              │ │  │
│  │  └────────────────────┘  └────────────────────┘  └──────────────┘ │  │
│  │                                                                      │  │
│  │  Features:                                                           │  │
│  │  • Isolated execution environment                                   │  │
│  │  • Visual element highlighting                                      │  │
│  │  • Screenshot capture at each step                                  │  │
│  │  • Safe simulation mode                                             │  │
│  │  • Automatic cleanup                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘


                              ┌─────────────────────┐
                              │   AUDIT & LOGGING   │
                              │                     │
                              │  • Action Logging   │
                              │  • Timestamps       │
                              │  • Event Tracking   │
                              │  • Audit Trail      │
                              └─────────────────────┘
```

## Data Flow

### 1. Action Verification Flow

```
User Request → Create Sandbox → Simulate Action → Show Preview → 
Request Auth → Verify Biometric → Execute Action → Audit Log
```

### 2. Detailed Sequence Diagram

```
Client          API Server      SandboxManager    BiometricAuth    Puppeteer
  │                 │                 │                 │              │
  │ POST /create    │                 │                 │              │
  ├────────────────>│                 │                 │              │
  │                 │ createSandbox() │                 │              │
  │                 ├────────────────>│                 │              │
  │                 │                 │   Launch Browser              │
  │                 │                 ├────────────────────────────────>│
  │                 │                 │                 │              │
  │                 │                 │<────────────────────────────────│
  │                 │<────────────────│                 │              │
  │<────────────────│                 │                 │              │
  │  {sandboxId}    │                 │                 │              │
  │                 │                 │                 │              │
  │ POST /simulate  │                 │                 │              │
  ├────────────────>│                 │                 │              │
  │                 │ simulateAction()│                 │              │
  │                 ├────────────────>│                 │              │
  │                 │                 │   Navigate & Capture          │
  │                 │                 ├────────────────────────────────>│
  │                 │                 │<────────────────────────────────│
  │                 │                 │   Screenshots                  │
  │                 │<────────────────│                 │              │
  │<────────────────│                 │                 │              │
  │  {steps,        │                 │                 │              │
  │   screenshots}  │                 │                 │              │
  │                 │                 │                 │              │
  │ POST /challenge │                 │                 │              │
  ├────────────────>│                 │                 │              │
  │                 │                 │ createChallenge()              │
  │                 │                 ├────────────────>│              │
  │                 │                 │<────────────────│              │
  │<────────────────│                 │                 │              │
  │  {challenge}    │                 │                 │              │
  │                 │                 │                 │              │
  │ [User provides biometric on device]                │              │
  │                 │                 │                 │              │
  │ POST /execute   │                 │                 │              │
  ├────────────────>│                 │                 │              │
  │                 │                 │ verifyResponse()               │
  │                 │                 ├────────────────>│              │
  │                 │                 │<────────────────│              │
  │                 │                 │  {verified}     │              │
  │                 │ executeAction() │                 │              │
  │                 ├────────────────>│                 │              │
  │                 │                 │   Click & Execute             │
  │                 │                 ├────────────────────────────────>│
  │                 │                 │<────────────────────────────────│
  │                 │<────────────────│                 │              │
  │<────────────────│                 │                 │              │
  │  {success,      │                 │                 │              │
  │   screenshot}   │                 │                 │              │
  │                 │                 │                 │              │
```

## Component Responsibilities

### SandboxManager
- **Purpose**: Orchestrate sandboxed browser instances
- **Responsibilities**:
  - Create and manage browser instances
  - Simulate actions with visual feedback
  - Execute verified actions
  - Maintain audit logs
  - Risk assessment

### BiometricAuth
- **Purpose**: Handle user authentication
- **Responsibilities**:
  - Generate authentication challenges
  - Verify biometric responses
  - Manage authentication state
  - Token expiration handling

### Express API
- **Purpose**: Provide REST interface
- **Responsibilities**:
  - Route handling
  - Request validation
  - Response formatting
  - Error handling
  - CORS management

### Puppeteer Integration
- **Purpose**: Browser automation
- **Responsibilities**:
  - Browser instance management
  - Page navigation
  - Element interaction
  - Screenshot capture
  - DOM manipulation

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Transport Security                           │
│  • HTTPS/TLS encryption                                │
│  • Certificate validation                              │
│                                                         │
│  Layer 2: API Security                                 │
│  • CORS policies                                       │
│  • Rate limiting                                       │
│  • Input validation                                    │
│                                                         │
│  Layer 3: Authentication                               │
│  • Biometric verification                             │
│  • Challenge-response protocol                        │
│  • Token expiration                                    │
│                                                         │
│  Layer 4: Execution Isolation                          │
│  • Sandboxed browser instances                        │
│  • No access to real payment data                     │
│  • Process isolation                                   │
│                                                         │
│  Layer 5: Audit & Monitoring                           │
│  • Complete action logging                            │
│  • Anomaly detection                                   │
│  • Security event tracking                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Load balancer distribution
- Multiple server instances

### Vertical Scaling
- Multi-core CPU utilization
- Memory optimization
- Efficient resource cleanup

### Resource Management
- Sandbox lifecycle management
- Automatic cleanup of expired sandboxes
- Memory leak prevention
- Browser instance pooling

## Performance Optimization

1. **Lazy Loading**: Browser instances created on-demand
2. **Caching**: Authentication challenges cached
3. **Compression**: API responses compressed
4. **CDN**: Static assets served via CDN
5. **Connection Pooling**: Reuse database connections

## Monitoring & Observability

- Health check endpoints
- Metrics collection (Prometheus)
- Structured logging (Winston)
- Error tracking
- Performance monitoring
- User analytics

---

**Version:** 1.0.0  
**Last Updated:** February 2026
