export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  content: string;
}

export interface StudyDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'text' | 'slides' | 'markdown';
  fileSize: number; // in bytes
  uploadedAt: string;
  pageCount: number;
  summary: string;
  topics: string[];
  chunks: DocumentChunk[];
  isSample?: boolean;
}

// In-memory document storage
let documentsStore: StudyDocument[] = [];

// High quality initial sample documents
export const SAMPLE_DOCUMENTS: StudyDocument[] = [
  {
    id: 'sample-bio-101',
    title: 'Biology 101: Cellular Respiration & Energy Metabolism',
    fileName: 'bio_101_cellular_respiration.pdf',
    fileType: 'pdf',
    fileSize: 245000,
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    pageCount: 6,
    summary: 'Comprehensive textbook guide covering Glycolysis, the Citric Acid (Krebs) Cycle, Electron Transport Chain, ATP Synthase, and oxidative phosphorylation.',
    topics: ['Cellular Respiration', 'Glycolysis', 'Krebs Cycle', 'Electron Transport Chain', 'ATP Synthesis'],
    isSample: true,
    chunks: [
      {
        id: 'bio-c1',
        docId: 'sample-bio-101',
        docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
        pageNumber: 1,
        sectionTitle: 'Chapter 1: Overview of Cellular Metabolism & Glycolysis',
        content: `Cellular respiration is the biochemical process by which eukaryotic cells break down glucose (C6H12O6) in the presence of oxygen to produce Adenosine Triphosphate (ATP), carbon dioxide (CO2), and water (H2O). The net balanced equation is: C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP.
Glycolysis is the initial phase occurring in the cytoplasm (cytosol). It does not require molecular oxygen and can proceed under aerobic and anaerobic conditions. A single 6-carbon glucose molecule undergoes a sequence of ten enzyme-catalyzed steps, yielding two 3-carbon pyruvate molecules, a net gain of 2 ATP (4 generated minus 2 invested in the preparatory phase), and 2 NADH molecules.`
      },
      {
        id: 'bio-c2',
        docId: 'sample-bio-101',
        docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
        pageNumber: 2,
        sectionTitle: 'Chapter 2: Pyruvate Oxidation & The Citric Acid (Krebs) Cycle',
        content: `Following glycolysis, if oxygen is available, the two pyruvate molecules cross the mitochondrial outer membrane and enter the mitochondrial matrix via a transport protein. In the matrix, pyruvate dehydrogenase converts pyruvate into Acetyl-CoA, releasing 1 molecule of CO2 and reducing NAD+ to NADH per pyruvate (totaling 2 NADH per glucose).
The Citric Acid Cycle, also known as the Krebs cycle or TCA cycle, takes place entirely within the mitochondrial matrix. Acetyl-CoA (2 carbons) combines with oxaloacetate (4 carbons) to form citrate (6 carbons). Through cyclical reactions, 2 turns of the cycle (one per acetyl group) generate 4 CO2, 6 NADH, 2 FADH2, and 2 ATP (or GTP). Oxaloacetate is regenerated at the conclusion of the cycle.`
      },
      {
        id: 'bio-c3',
        docId: 'sample-bio-101',
        docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
        pageNumber: 3,
        sectionTitle: 'Chapter 3: The Mitochondrial Electron Transport Chain (ETC)',
        content: `The Electron Transport Chain (ETC) is located along the inner mitochondrial membrane (cristae). It consists of four multi-protein complexes: Complex I (NADH-Q oxidoreductase), Complex II (succinate dehydrogenase), Complex III (Q-cytochrome c oxidoreductase), and Complex IV (cytochrome c oxidase).
Electrons donated by NADH enter at Complex I, while electrons from FADH2 enter downstream at Complex II. As high-energy electrons transfer along electron carriers (Ubiquinone/CoQ and Cytochrome c), complexes I, III, and IV pump protons (H+) from the mitochondrial matrix into the intermembrane space. This creates an electrochemical proton gradient (proton-motive force). Oxygen acts as the terminal electron acceptor at Complex IV, combining with electrons and protons to generate water (H2O).`
      },
      {
        id: 'bio-c4',
        docId: 'sample-bio-101',
        docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
        pageNumber: 4,
        sectionTitle: 'Chapter 4: ATP Synthase & Chemiosmosis',
        content: `Chemiosmosis describes the diffusion of protons down their electrochemical gradient across the inner mitochondrial membrane through the enzyme complex ATP Synthase (F0F1 complex). The rotor subunit F0 turns as protons stream through from the intermembrane space into the matrix.
This rotational kinetic energy drives the catalytic F1 head to phosphorylate ADP with inorganic phosphate (Pi) into ATP. Under optimal stoichiometry, each NADH yields approximately 2.5 ATP, while each FADH2 yields approximately 1.5 ATP because its electrons enter at Complex II, bypassing the proton pump of Complex I. Total theoretical yield per glucose molecule is 30 to 32 ATP.`
      },
      {
        id: 'bio-c5',
        docId: 'sample-bio-101',
        docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
        pageNumber: 5,
        sectionTitle: 'Chapter 5: Anaerobic Fermentation Pathways',
        content: `When molecular oxygen is absent, oxidative phosphorylation halts because the electron transport chain cannot offload electrons. Under anaerobic conditions, cells utilize fermentation to regenerate NAD+ from NADH so that glycolysis can continue to generate 2 ATP per glucose.
In lactic acid fermentation (occurring in human skeletal muscle cells and yogurt bacteria like Lactobacillus), pyruvate is reduced directly by NADH into lactate without carbon dioxide release. In alcoholic fermentation (occurring in yeast Saccharomyces cerevisiae), pyruvate is decarboxylated into acetaldehyde (releasing CO2), which is subsequently reduced by NADH to produce ethanol.`
      },
      {
        id: 'bio-c6',
        docId: 'sample-bio-101',
        docTitle: 'Biology 101: Cellular Respiration & Energy Metabolism',
        pageNumber: 6,
        sectionTitle: 'Chapter 6: Metabolic Regulation & Allosteric Feedback',
        content: `Respiration rate is tightly controlled through allosteric enzyme regulation to avoid wasteful overproduction of ATP. The primary rate-limiting regulatory enzyme in glycolysis is Phosphofructokinase-1 (PFK-1).
PFK-1 is allosterically inhibited by high levels of ATP and citrate (signaling abundant cellular energy). Conversely, PFK-1 is activated by high levels of AMP and ADP, which indicate energy depletion and stimulate respiration. Similarly, isocitrate dehydrogenase in the Krebs cycle is inhibited by ATP and NADH, and activated by ADP.`
      }
    ]
  },
  {
    id: 'sample-cs-transformer',
    title: 'Computer Science: Transformer Architecture & Attention Mechanisms',
    fileName: 'transformers_and_attention_lecture_notes.pdf',
    fileType: 'pdf',
    fileSize: 310000,
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    pageCount: 5,
    summary: 'Deep dive into Transformer neural networks, Scaled Dot-Product Attention, Multi-Head Attention, Positional Encoding, and Feed-Forward sublayers.',
    topics: ['Transformers', 'Self-Attention', 'Positional Encoding', 'Encoder-Decoder', 'Deep Learning'],
    isSample: true,
    chunks: [
      {
        id: 'trans-c1',
        docId: 'sample-cs-transformer',
        docTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
        pageNumber: 1,
        sectionTitle: 'Lecture 1: The Bottlenecks of Recurrent Neural Networks (RNNs)',
        content: `Prior to 2017, sequence modeling relied primarily on Recurrent Neural Networks (RNNs), Long Short-Term Memory (LSTM), and Gated Recurrent Units (GRUs). These architectures processed sequences sequentially token-by-token: h_t = f(h_{t-1}, x_t).
This sequential dependency created two critical bottlenecks: first, inability to parallelize training across sequence lengths, constraining model scaling on modern GPU clusters; second, vanishing and exploding gradients when propagating representations across long distances, hindering the capture of long-range dependencies across distant words.`
      },
      {
        id: 'trans-c2',
        docId: 'sample-cs-transformer',
        docTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
        pageNumber: 2,
        sectionTitle: 'Lecture 2: Scaled Dot-Product Attention Formula',
        content: `The Transformer architecture replaces recurrence entirely with attention mechanisms. Scaled Dot-Product Attention operates on three matrices: Queries (Q), Keys (K), and Values (V), each of dimension d_k (or d_v).
The attention score is computed as: Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V.
The scaling factor 1 / sqrt(d_k) is essential: for large projection dimensions d_k, the dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. Dividing by the square root of d_k stabilizes the variance to 1.0 and maintains smooth gradient flow.`
      },
      {
        id: 'trans-c3',
        docId: 'sample-cs-transformer',
        docTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
        pageNumber: 3,
        sectionTitle: 'Lecture 3: Multi-Head Attention (MHA)',
        content: `Instead of performing a single attention function with d_model-dimensional queries, keys, and values, Multi-Head Attention linearly projects queries, keys, and values h times with different learned parameter matrices W_i^Q, W_i^K, and W_i^V to dimensions d_k, d_k, and d_v respectively.
Each head computes attention independently in parallel: head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V).
The outputs of all h heads are concatenated and projected with a final output matrix W^O: MultiHead(Q,K,V) = Concat(head_1, ..., head_h) * W^O. This allows the model to jointly attend to information from different representation subspaces at different positions.`
      },
      {
        id: 'trans-c4',
        docId: 'sample-cs-transformer',
        docTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
        pageNumber: 4,
        sectionTitle: 'Lecture 4: Positional Encoding & Feed-Forward Networks',
        content: `Since the Transformer contains no recurrence or convolution, it is invariant to sequence permutation. To inject knowledge of word order, sinusoidal Positional Encodings are added directly to the input token embeddings:
PE_(pos, 2i) = sin(pos / 10000^(2i / d_model))
PE_(pos, 2i+1) = cos(pos / 10000^(2i / d_model)), where pos is the token index and i is the dimension index.
Additionally, each layer contains a Position-wise Feed-Forward Network (FFN) applied to each position identically: FFN(x) = max(0, x * W_1 + b_1) * W_2 + b_2, with two linear transformations and a ReLU or GELU non-linearity in between.`
      },
      {
        id: 'trans-c5',
        docId: 'sample-cs-transformer',
        docTitle: 'Computer Science: Transformer Architecture & Attention Mechanisms',
        pageNumber: 5,
        sectionTitle: 'Lecture 5: Residual Connections & Layer Normalization',
        content: `Each sublayer in both the encoder and decoder is surrounded by a residual skip connection followed by Layer Normalization: Output = LayerNorm(x + Sublayer(x)).
In modern architectures, Pre-LayerNorm (applying normalization prior to the sublayer) is preferred over Post-LayerNorm for training stability.
In the decoder, Masked Multi-Head Attention is applied: subsequent positions are masked out with negative infinity (-inf) before softmax to preserve autoregressive causality, preventing the decoder from attending to future tokens during training.`
      }
    ]
  },
  {
    id: 'sample-history-industrial',
    title: 'World History: The First Industrial Revolution (1760–1840)',
    fileName: 'industrial_revolution_source_readings.txt',
    fileType: 'text',
    fileSize: 185000,
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    pageCount: 4,
    summary: 'Analysis of the transition from agrarian cottage industry to mechanized factory production in Britain, key inventions like the steam engine, and social consequences.',
    topics: ['Industrial Revolution', 'Steam Engine', 'Factory System', 'Urbanization', 'Economic History'],
    isSample: true,
    chunks: [
      {
        id: 'hist-c1',
        docId: 'sample-history-industrial',
        docTitle: 'World History: The First Industrial Revolution (1760–1840)',
        pageNumber: 1,
        sectionTitle: 'Section 1: Origins in Eighteenth-Century Britain',
        content: `The First Industrial Revolution originated in Great Britain around 1760 before diffusing to Western Europe and North America. Britain possessed unique institutional and geographic advantages: abundant surface deposits of coal and iron ore, an insular island geography with navigable rivers and coastal canals, established commercial banking and patent laws, and accumulated mercantile capital.
Prior to mechanization, textile production was organized under the 'domestic system' (cottage industry), where merchant-capitalists distributed raw wool or cotton to rural farming families who spun thread and wove cloth manually at home using spinning wheels and handlooms.`
      },
      {
        id: 'hist-c2',
        docId: 'sample-history-industrial',
        docTitle: 'World History: The First Industrial Revolution (1760–1840)',
        pageNumber: 2,
        sectionTitle: 'Section 2: Textile Mechanization & The Steam Engine',
        content: `Key mechanical innovations transformed textiles into the premier industrial sector. John Kay's Flying Shuttle (1733) doubled weaving output. In response to yarn shortages, James Hargreaves invented the Spinning Jenny (1764), Richard Arkwright developed the water-powered Water Frame (1769), and Samuel Crompton synthesized both in the Spinning Mule (1779).
Concurrently, James Watt, collaborating with industrialist Matthew Boulton in 1769, radically improved Thomas Newcomen's primitive atmospheric engine by introducing a separate condenser. Watt's rotary steam engine freed factories from geographical dependence on fast-flowing rivers, allowing mills to concentrate near coalfields and urban transport hubs.`
      },
      {
        id: 'hist-c3',
        docId: 'sample-history-industrial',
        docTitle: 'World History: The First Industrial Revolution (1760–1840)',
        pageNumber: 3,
        sectionTitle: 'Section 3: Urbanization & The Rise of Industrial Cities',
        content: `Steam-powered mechanization stimulated explosive, unplanned urbanization. Industrial centers like Manchester, Birmingham, and Leeds witnessed unprecedented demographic inflows as agricultural laborers were displaced by parliamentary enclosure acts and rural poverty. Manchester grew from a market town of 25,000 in 1770 to over 300,000 by 1850.
Rapid urbanization outstripped municipal infrastructure, resulting in unpaved streets, contaminated water supplies, cellar dwellings, and frequent outbreaks of cholera and typhus. Life expectancy among working-class laborers in industrial towns dropped below 20 years during peak decades.`
      },
      {
        id: 'hist-c4',
        docId: 'sample-history-industrial',
        docTitle: 'World History: The First Industrial Revolution (1760–1840)',
        pageNumber: 4,
        sectionTitle: 'Section 4: Labor Conditions, Resistance, and Factory Acts',
        content: `The factory regime introduced strict clock-regulated discipline, replacing task-oriented agrarian rhythms with 12 to 16-hour shifts, six days a week. Mill owners heavily recruited child and female labor due to lower wages and dexterity required for unjamming textile machinery.
Displaced artisans organized resistance: between 1811 and 1816, the Luddites smashed mechanical weaving frames they viewed as detrimental to customary craft livelihoods. Growing humanitarian pressure led to parliamentary investigations and legislative reform, notably the Factory Act of 1833, which banned factory employment for children under age 9 and limited working hours for older minors.`
      }
    ]
  }
];

// Initialize documents store with sample documents
export function getDocuments(): StudyDocument[] {
  if (documentsStore.length === 0) {
    documentsStore = [...SAMPLE_DOCUMENTS];
  }
  return documentsStore;
}

export function resetToSampleDocuments(): StudyDocument[] {
  documentsStore = [...SAMPLE_DOCUMENTS];
  return documentsStore;
}

export function addDocument(doc: StudyDocument): void {
  documentsStore.unshift(doc);
}

export function deleteDocument(id: string): boolean {
  const initialLen = documentsStore.length;
  documentsStore = documentsStore.filter((d) => d.id !== id);
  return documentsStore.length < initialLen;
}

export function getDocumentById(id: string): StudyDocument | undefined {
  return documentsStore.find((d) => d.id === id);
}

// Simple text chunker for uploaded text/pdf
export function chunkText(
  text: string,
  docId: string,
  docTitle: string,
  chunkSize: number = 750,
  overlap: number = 100
): DocumentChunk[] {
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (!cleanText) return [];

  // Split into paragraphs first
  const paragraphs = cleanText.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  let currentChunk = '';
  let currentPage = 1;
  let chunkIdx = 1;

  for (const para of paragraphs) {
    // Check if paragraph contains page markers like "Page 3" or form feeds
    const pageMatch = para.match(/---\s*Page\s*(\d+)\s*---/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
    }

    if ((currentChunk + ' ' + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${docId}-chunk-${chunkIdx++}`,
        docId,
        docTitle,
        pageNumber: currentPage,
        content: currentChunk.trim(),
      });
      // Retain overlap if feasible
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.min(words.length, Math.floor(overlap / 6)));
      currentChunk = overlapWords.join(' ') + '\n' + para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${docId}-chunk-${chunkIdx++}`,
      docId,
      docTitle,
      pageNumber: currentPage,
      content: currentChunk.trim(),
    });
  }

  return chunks;
}

// Keyword-based / TF-IDF hybrid passage retriever with relevance ranking
export function retrieveRelevantPassages(
  query: string,
  selectedDocIds?: string[],
  topK: number = 4
): { chunk: DocumentChunk; score: number }[] {
  const allDocs = getDocuments();
  const targetDocs = selectedDocIds && selectedDocIds.length > 0
    ? allDocs.filter((d) => selectedDocIds.includes(d.id))
    : allDocs;

  const allChunks: DocumentChunk[] = [];
  for (const doc of targetDocs) {
    allChunks.push(...doc.chunks);
  }

  if (allChunks.length === 0) return [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryTerms.length === 0) {
    return allChunks.slice(0, topK).map((c) => ({ chunk: c, score: 0.5 }));
  }

  const scored = allChunks.map((chunk) => {
    const textLower = (chunk.content + ' ' + (chunk.sectionTitle || '')).toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Frequency match
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = (textLower.match(regex) || []).length;
      if (matches > 0) {
        score += matches * 2.5;
      } else if (textLower.includes(term)) {
        score += 1.0;
      }
    }

    // Boost if query matches sectionTitle
    if (chunk.sectionTitle) {
      const sectionLower = chunk.sectionTitle.toLowerCase();
      for (const term of queryTerms) {
        if (sectionLower.includes(term)) {
          score += 4.0;
        }
      }
    }

    return { chunk, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return topK chunks that have non-zero or best scores
  return scored.slice(0, topK);
}
