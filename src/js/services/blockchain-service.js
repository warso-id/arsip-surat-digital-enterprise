/**
 * BLOCKCHAIN SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Document verification using blockchain
 */

class BlockchainService {
  constructor() {
    this.chain = [];
    this.isVerifying = false;
  }
  
  /**
   * Initialize blockchain service
   */
  init() {
    console.log('✅ Blockchain Service initialized');
  }
  
  /**
   * Get full chain
   */
  async getChain() {
    try {
      const response = await api.get('blockchain.getChain');
      
      if (response.status === 'success') {
        this.chain = response.data.chain || [];
        return this.chain;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get chain:', error);
      return [];
    }
  }
  
  /**
   * Get block by index
   */
  async getBlock(index) {
    try {
      const response = await api.get('blockchain.getBlock', { index });
      
      if (response.status === 'success') {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get block:', error);
      return null;
    }
  }
  
  /**
   * Add block to chain
   */
  async addBlock(data) {
    try {
      const response = await api.post('blockchain.addBlock', data);
      
      if (response.status === 'success') {
        NotificationService.success('Block berhasil ditambahkan ke blockchain');
        return response.data;
      }
      
      throw new Error(response.message);
    } catch (error) {
      NotificationService.error('Gagal menambahkan block');
      throw error;
    }
  }
  
  /**
   * Verify entire chain
   */
  async verifyChain() {
    if (this.isVerifying) return null;
    
    this.isVerifying = true;
    
    try {
      const response = await api.get('blockchain.verifyChain');
      
      if (response.status === 'success') {
        return {
          valid: response.data.valid,
          invalidBlocks: response.data.invalidBlocks || [],
          totalBlocks: response.data.totalBlocks || 0
        };
      }
      
      return { valid: false, invalidBlocks: [], totalBlocks: 0 };
    } catch (error) {
      console.error('Chain verification failed:', error);
      return { valid: false, invalidBlocks: [], totalBlocks: 0 };
    } finally {
      this.isVerifying = false;
    }
  }
  
  /**
   * Verify single document
   */
  async verifyDocument(fileOrHash) {
    try {
      let hash;
      
      if (typeof fileOrHash === 'string') {
        hash = fileOrHash;
      } else if (fileOrHash instanceof File) {
        hash = await this.hashFile(fileOrHash);
      } else {
        hash = await this.hashData(fileOrHash);
      }
      
      const response = await api.post('verify.document', { hash });
      
      if (response.status === 'success') {
        return {
          verified: response.data.verified,
          blockIndex: response.data.blockIndex,
          timestamp: response.data.timestamp,
          data: response.data.data
        };
      }
      
      return { verified: false };
    } catch (error) {
      console.error('Document verification failed:', error);
      return { verified: false };
    }
  }
  
  /**
   * Register document on blockchain
   */
  async registerDocument(documentData) {
    const {
      id,
      type,
      nomorSurat,
      perihal,
      fileUrl,
      metadata = {}
    } = documentData;
    
    // Create hash of document
    const hash = await this.hashData({
      id,
      type,
      nomorSurat,
      perihal,
      timestamp: new Date().toISOString()
    });
    
    const blockData = {
      documentId: id,
      documentType: type,
      hash: hash,
      nomorSurat: nomorSurat || '',
      perihal: perihal || '',
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString()
    };
    
    return this.addBlock(blockData);
  }
  
  /**
   * Hash data using SHA-256
   */
  async hashData(data) {
    const encoder = new TextEncoder();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Hash file
   */
  async hashFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const hashBuffer = await crypto.subtle.digest('SHA-256', reader.result);
        const hash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        resolve(hash);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Get blockchain stats
   */
  async getStats() {
    try {
      const response = await api.get('blockchain.getStats');
      
      if (response.status === 'success') {
        return {
          blocks: response.data.blocks || 0,
          documents: response.data.documents || 0,
          lastBlockTime: response.data.lastBlockTime,
          valid: response.data.valid
        };
      }
      
      return { blocks: 0, documents: 0, lastBlockTime: null, valid: true };
    } catch (error) {
      return { blocks: 0, documents: 0, lastBlockTime: null, valid: true };
    }
  }
  
  /**
   * Generate proof of existence
   */
  async generateProof(documentId) {
    const block = await this.getBlock(documentId);
    
    if (!block) return null;
    
    return {
      documentId,
      blockIndex: block.index,
      hash: block.hash,
      timestamp: block.timestamp,
      previousHash: block.previousHash,
      proof: `BLOCK-${block.index}-${block.hash.substring(0, 16)}`
    };
  }
  
  /**
   * Verify proof of existence
   */
  async verifyProof(proof) {
    if (!proof) return false;
    
    // Extract block index and hash from proof
    const match = proof.match(/BLOCK-(\d+)-([a-f0-9]+)/);
    if (!match) return false;
    
    const blockIndex = parseInt(match[1]);
    const blockHash = match[2];
    
    const block = await this.getBlock(blockIndex);
    
    if (!block) return false;
    
    return block.hash.startsWith(blockHash);
  }
}

// Singleton instance
const BlockchainService = new BlockchainService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlockchainService };
}
