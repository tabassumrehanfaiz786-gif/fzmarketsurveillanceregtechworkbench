 # FZ Market Surveillance & RegTech Workbench
### *Autonomous Algorithmic Integrity, Microstructure Abuse Detection & Statutory STOR Audit System*

[![Live Research Deployment](https://img.shields.io/badge/Live%20Platform-Active-success.svg?style=flat-square)](https://fzmarketsurveillanceregtechworkbench.lovable.app)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0008--XXXX--XXXX-green.svg?style=flat-square)](https://orcid.org)
[![SSRN Papers](https://img.shields.io/badge/SSRN-5%20Working%20Papers-1e3a8a.svg?style=flat-square)](https://papers.ssrn.com)
[![Statutory Framework](https://img.shields.io/badge/Statutory%20Mapping-UK%20MAR%20%7C%20MiFID%20II%20RTS%206-orange.svg?style=flat-square)](https://www.handbook.fca.org.uk)
[![Test Suite](https://img.shields.io/badge/Unit%20Tests-85%2F85%20Passing-brightgreen.svg?style=flat-square)](./src)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 1. Executive Research Abstract

The **FZ Market Surveillance & RegTech Workbench** is an empirical computational jurisprudence and regulatory technology (RegTech) platform designed to address enforcement challenges in fragmented, high-frequency digital asset markets.

Classical market surveillance architectures frequently rely on end-of-day T+1 batch heuristics or static price collars. In contrast, modern algorithmic manipulation and liquidity cascades occur on sub-millisecond volume clocks. This project operationalizes statutory obligations under:
* **The UK Market Abuse Regulation (UK MAR - Retained EU Reg 596/2014)**: Articles 8 (Insider Dealing), 12 (Market Manipulation), and 16 (Prevention and Detection of Market Abuse);
* **MiFID II Regulatory Technical Standard 6 (Commission Delegated Regulation 2017/589)**: Articles 12–18 (Pre-trade risk controls, algorithmic throttling, Order-to-Trade Ratios, and automated kill switches);
* **The UK Financial Services and Markets Act 2023 (FSMA 2023)** & **EU Markets in Crypto-Assets Regulation (MiCA Title VI)**.

The workbench couples real-time public L2 tick streaming (Coinbase and Binance) with continuous-time point processes, volume-clock adverse selection estimators, and an automated Suspicious Transaction and Order Report (**STOR**) generator producing regulatory-standard A4 PDF dossiers for human compliance officers and the UK Financial Conduct Authority (FCA).

---

## 2. Researcher & Author Information

* **Author:** **Faizan Rehan**
* **Academic Focus:** LL.B / Prospective LLM Candidate in Financial Regulation, Corporate Law, and International Banking Law
* **ORCID Identifier:** [0009-0008-XXXX-XXXX](https://orcid.org) *(Update with your 16-digit ORCID)*
* **SSRN Author Profile:** [SSRN Research Page](https://papers.ssrn.com) *(Update with your SSRN profile link)*
  * *Portfolio includes 5 SSRN working papers investigating algorithmic governance, computational market abuse jurisprudence, and FinTech regulation.*
* **Live Web Platform:** [https://fzmarketsurveillanceregtechworkbench.lovable.app](https://fzmarketsurveillanceregtechworkbench.lovable.app)
* **GitHub Repository:** [github.com/tabassumrehanfaiz786-gif/fz-quant-terminal](https://github.com/tabassumrehanfaiz786-gif/fz-quant-terminal)

---

## 3. Statutory Mapping & Typology Taxonomy

The platform maps live order-flow anomalies directly against statutory legal provisions:

| Statutory Provision | Abuse Typology | Microstructure Metric | Algorithmic Detection Mechanism |
| :--- | :--- | :--- | :--- |
| **UK MAR Art 12(1)(a)(i)** | **Spoofing & Layering** | Quote Lifetime / Depth Collapse | Flash bid/ask placement inside top 5 book ticks followed by rapid cancellation (\(<100\text{ ms}\)) without fill. |
| **MiFID II RTS 6 Art 18** | **Quote Stuffing** | Order-to-Trade Ratio (OTR) | Tracks submission count against executed trades; flags excessive quote-to-fill ratios (\(\text{OTR} > 50:1\)). |
| **UK MAR Art 12(1)(a)(i)** | **Wash Trading Heuristic** | Trade Velocity & Zero Delta | High-frequency matched prints executed at identical prices across tight time intervals with zero net inventory change. |
| **UK MAR Annex I Sec 2(e)** | **Momentum Ignition / Cascades** | Hawkes Branching Ratio (\(\hat{\eta}\)) | Self-exciting cluster detection when \(\hat{\eta} \ge 1.0\), indicating an explosive, non-Poisson liquidity cascade. |
| **UK MAR Art 12(1)(a)(ii)** | **Marking the Close** | Window Volume Concentration | Abnormal volume acceleration and spread widening inside designated benchmark settlement windows. |
| **UK MAR Art 8 / Art 16** | **Informed Flow / Insider Dealing** | Volume-Clock Toxicity (\(\text{VPIN}\)) | CDF of toxic volume bucket imbalance (\(\text{VPIN} > 0.85\)) indicating private-information adverse selection. |
| **MiFID II RTS 6 Art 12–15** | **Algorithmic Runaway** | Delta Drift / Latency Divergence | Real-time Kill Switch simulator testing automated session termination and resting order liquidation. |
| **MiCA Title VI / FSMA 2023** | **Oracle Manipulation** | Mark-to-Index Basis Divergence | Cross-venue spot/perp basis monitoring and collateral valuation collar stress tests. |

---

## 4. Mathematical & Microstructure Architecture

The system decouples empirical estimation into pure, deterministic mathematical engines:

### A. Continuous-Time Self-Exciting Hawkes Process (`src/lib/hawkes.ts`)
To detect endogenous liquidity cascades and algorithmic momentum ignition without relying on exogenous news assumptions, the arrival intensity \(\lambda(t)\) is modeled as:

$$\lambda(t) = \mu + \sum_{t_i < t} \alpha e^{-\beta (t - t_i)}$$

Where:
* \(\mu\) is the baseline exogenous Poisson arrival rate;
* \(\alpha\) is the excitation magnitude of incoming market orders;
* \(\beta\) is the exponential memory decay rate.

The workbench continuously solves for the **Branching Ratio** \(\hat{\eta} = \frac{\alpha}{\beta}\):
* \(\hat{\eta} < 0.80\): Subcritical / mean-reverting Poisson flow.
* \(0.80 \le \hat{\eta} < 1.0\): Heavy reflexive cluster regime.
* \(\hat{\eta} \ge 1.0\): Supercritical explosive cascade (**Statutory Alert: Potential Market Disruption**).

### B. Volume-Synchronized Probability of Toxicity (`src/lib/vpin.ts`)
Standard clock time is susceptible to high-frequency volume distortion. The workbench applies the **Easley, López de Prado, and O’Hara (2012)** volume clock, dividing trade flow into discrete volume bars of equal size \(V\):

$$VPIN = \frac{\sum_{\tau=1}^{N} |V_\tau^B - V_\tau^S|}{N \cdot V}$$

Where trade signs are classified using trade-tick bulk volume classification against the prevailing Bid-Ask spread. When VPIN crosses the 85th percentile threshold, the workbench records a toxic flow anomaly under UK MAR Article 16.

### C. Order-Book Microstructure (`src/lib/order-book.ts`)
* Maintains real-time L2 order-book synchronization via live WebSockets.
* Identifies resting liquidity walls (\(\ge 150\text{ BTC}\)) and detects anomalous order cancellations without execution.
* Enforces sequence continuity on public feeds.

---

## 5. Regulatory Technology (RegTech) Features

1. **Automated Incident Registry (`/` and `/stor`)**:
   Tracks and categorizes suspected abusive behavior with rolling cooldown deduplication, preventing alert fatigue while logging evidentiary context.
2. **One-Click FCA STOR Draft Generator (`/stor`)**:
   Formats identified incidents into the statutory template specified under UK MAR Article 16 and FCA SUP 15 Annex 5R, compiling transaction timestamps, instrument IDs, algorithmic indicators, and supporting data.
3. **Formal Compliance PDF Exporter (`src/lib/stor-pdf.ts`)**:
   Client-side A4 document renderer generating sealed audit files with exact timestamps, mathematical indices, and statutory citations.
4. **MiFID II RTS 6 Kill-Switch Bench (`/killswitch`)**:
   Interactive testing suite allowing risk officers to simulate algorithmic runaways, flash crashes, and Mango Markets-style oracle manipulation to evaluate automated circuit-breaker responses.

---

## 6. Software Architecture & Empirical Validation

The workbench is engineered to production-level deterministic standards:

* **Framework:** TanStack Start v1 (Full-stack React 19, TypeScript, Tailwind CSS v4).
* **Architecture:** Strict architectural separation between pure analytical engines (`src/lib/*.ts`) and presentation layers (`src/routes/*.tsx`). All surveillance models are pure functions devoid of side effects.
* **Testing:** Comprehensive test suite written in Vitest.
  * **85 passing unit tests** covering Hawkes branching ratios, VPIN volume bucketing, order-book reconstruction, queue priority, and statutory incident cooldowns.
  * Run tests locally via:
    ```bash
    npm test
    ```

---

## 7. Installation & Local Reproduction

Prerequisites: **Node.js 20+** or **Bun**.

```bash
# Clone the research repository
git clone https://github.com/tabassumrehanfaiz786-gif/fz-quant-terminal.git
cd fz-quant-terminal

# Install dependencies
npm install

# Execute deterministic test suite
npm test

# Launch the live research environment
npm run dev
