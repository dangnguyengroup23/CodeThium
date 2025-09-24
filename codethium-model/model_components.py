
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader,IterableDataset
import torch.nn.functional as F
import sentencepiece as spm
import numpy as np
import json
import os
import math
import random
from typing import List, Tuple, Optional
from tqdm import tqdm
import matplotlib.pyplot as plt
from pathlib import Path
import matplotlib.pyplot as plt
from IPython import display
display.set_matplotlib_formats('svg')

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
device
special_tokens = ["<PAD>","<BOS>","<EOS>","<UNK>","<NL>","<INDENT>","<DEDENT>"]
class Attention(nn.Module):
  def __init__(self,d_model,n_heads,dropout=0.1,max_seq_len=512):
    super().__init__()
    assert d_model % n_heads ==0

    self.d_model = d_model
    self.n_heads = n_heads
    self.d_k = d_model//n_heads

    self.c_atten = nn.Linear(d_model,3*d_model)
    self.c_proj = nn.Linear(d_model,d_model)

    self.dropout = nn.Dropout(dropout)
    self.resid_dropout = nn.Dropout(dropout)

    self.register_buffer("casual_mask",torch.tril(torch.ones(max_seq_len,max_seq_len)).view(1,1,max_seq_len,max_seq_len))

    self.scale = 1.0/math.sqrt(self.d_k)

  def forward(self,x):
    batch_size,seq_len,d_model = x.size()

    qkv = self.c_atten(x)

    q,k,v = qkv.split(d_model,dim=2)

    q = q.view(batch_size,seq_len,self.n_heads,self.d_k).transpose(1,2)
    k = k.view(batch_size,seq_len,self.n_heads,self.d_k).transpose(1,2)
    v = v.view(batch_size,seq_len,self.n_heads,self.d_k).transpose(1,2)

    attn_scores = torch.matmul(q,k.transpose(-2,-1))*self.scale

    casual_mask = self.casual_mask[:,:,:seq_len,:seq_len]

    attn_scores = attn_scores.masked_fill(casual_mask==0,float('-inf'))

    attn_weights = F.softmax(attn_scores,dim=-1)
    attn_weights = self.dropout(attn_weights)

    attn = torch.matmul(attn_weights,v)

    attn = attn.transpose(1,2).contiguous().view(batch_size,seq_len,d_model)

    out = self.resid_dropout(self.c_proj(attn))
    return out

class PositionalEncoding(nn.Module):
  def __init__(self,d_model,max_seq_len=512):
    super().__init__()
    pe = torch.zeros(max_seq_len,d_model)
    position = torch.arange(0,max_seq_len).unsqueeze(1).float()

    div_term = torch.exp(torch.arange(0,d_model,2).float()* -math.log(10000)/d_model)

    pe[:,0::2] = torch.sin(position*div_term)
    pe[:,1::2] = torch.cos(position*div_term)

    self.register_buffer('pe',pe.unsqueeze(0))

  def forward(self,x):
    return x + self.pe[:,:x.size(1)]

class FeedForward(nn.Module):
  def __init__(self,d_model,dropout=0.1):
    super().__init__()
    self.net = nn.Sequential(
        nn.Linear(d_model,4*d_model),
        nn.GELU(),
        nn.Linear(4*d_model,d_model),
        nn.Dropout(dropout)
    )
  def forward(self,x):
    return self.net(x)

class Block(nn.Module):
  def __init__(self,d_model,n_heads,max_seq_len=512,dropout=0.1):
    super().__init__()
    self.ln1 = nn.LayerNorm(d_model)
    self.attn = Attention(d_model,n_heads,dropout,max_seq_len)
    self.ln2 = nn.LayerNorm(d_model)
    self.ff = FeedForward(d_model,dropout)
  def forward(self,x):
    x = x + self.attn(self.ln1(x))
    x = x + self.ff(self.ln2(x))
    return x

from ast import mod
class tinyTransformerDecoderOnly(nn.Module):
  def __init__(self,vocab_size,d_model,n_heads,n_layers,max_seq_len=512,dropout=0.1):
    super().__init__()
    self.max_seq_len = max_seq_len
    self.tok_emb = nn.Embedding(vocab_size,d_model)
    self.pos_emb = PositionalEncoding(d_model,max_seq_len)
    self.blocks = nn.Sequential(*[Block(d_model,n_heads,max_seq_len,dropout) for _ in range(n_layers)])
    self.ln_f = nn.LayerNorm(d_model)
    self.head = nn.Linear(d_model,vocab_size,bias=False)
    self.apply(self._init_weights)
  def _init_weights(self,module):
    if isinstance(module,(nn.Linear,nn.Embedding)):
      nn.init.normal_(module.weight,mean=0.0,std=0.02)
    if isinstance(module,nn.Linear) and module.bias is not None:
      nn.init.zeros_(module.bias)

  def forward(self,idx,targets=None):
    batch_size,seq_len = idx.size()
    assert seq_len <= self.max_seq_len
    x = self.tok_emb(idx)
    x = self.pos_emb(x)
    x = self.blocks(x)
    x = self.ln_f(x)
    logits = self.head(x)
    loss=None
    if targets is not None:
      loss = F.cross_entropy(logits.view(-1,logits.size(-1)),targets.view(-1))

    return logits,loss
  
def train_full_sentencepiece_model(text_examples,model_prefix='fullspm',vocab_size=5000,model_type='bpe'):
  try:
    import sentencepiece as spm
  except Exception as e:
    raise RuntimeError('Install sentencepiece (pip install sentencepiece) to use full SPM pipeline.') from e

  tmp = model_prefix + '_corpus.txt'
  with open(tmp,'w',encoding='utf-8') as f:
    for line in text_examples:
      f.write(line.replace('\n',' ')+'\n')
  user_symbols = ','.join(special_tokens)
  cmd = (
        f"--input={tmp} --model_prefix={model_prefix} --vocab_size={vocab_size} "
        f"--model_type={model_type} --unk_id=0 --pad_id=1 --bos_id=-1 --eos_id=-1 "
        f"--user_defined_symbols={user_symbols}"
    )
  spm.SentencePieceTrainer.Train(cmd)
  sp = spm.SentencePieceProcessor()
  model_file= f"{model_prefix}.model"
  if not os.path.exists(model_file):
    raise FileNotFoundError(f"SentencePiece model file {model_file} was not created.")
  sp.load(model_file)
  return sp

def spm_tokenize_text(sp_processor,text):
  return sp_processor.encode(text,out_type=str)

def spm_detokenize_pieces(sp_processor,pieces):
  try:
    return sp_processor.decode_pieces(pieces)
  except Exception:
    return "".join(pieces)

class Vocab:
  def __init__(self,sp_processor):
    self.sp = sp_processor
    self.id2token = self.sp.get_piece_size() and [self.sp.id_to_piece(i) for i in range(self.sp.get_piece_size())] or []
    self.token2id = {t: i for i,t in enumerate(self.id2token)}
    for t in special_tokens:
      if t not in self.token2id:
        self.token2id[t] = len(self.id2token)
        self.id2token.append(t)
  def encode(self,pieces):
    return [self.token2id.get(p,self.token2id.get("<UNK>")) for  p in pieces]
  def decode(self,id):
    return [self.id2token[i] if 0<= i < len(self.id2token) else '<ERR>' for i in id]

  def size(self):
    return len(self.id2token)

def build_token_stream_fullspm(examples,sp_processor=None,max_rep=1):
  all_piece_lists = []
  for ex in examples:
    pieces = spm_tokenize_text(sp_processor,ex) if sp_processor else ex.split()
    all_piece_lists.append(pieces)
  vocab = Vocab(sp_processor)
  long_ids = []

  for pieces in all_piece_lists:
    ids = vocab.encode(pieces)
    long_ids.extend(ids)
  long_ids = long_ids*max(1,max_rep)
  return long_ids,vocab

class StreamDataset(IterableDataset):
  def __init__(self,token_stream,max_len):
    self.tokens = torch.tensor(token_stream,dtype=torch.long)
    self.max_len = max_len
    self.actual_len = len(self.tokens)
  def __iter__(self):
    while True:
      if self.actual_len <= self.max_len+1:
        start=0
      else:
        start = random.randint(0,max(0,self.actual_len-self.max_len-1))
      chunk = self.tokens[start:start+self.max_len+1]
      x = chunk[:-1].clone()
      y = chunk[1:].clone()
      yield x,y

@torch.no_grad()
def sample_logits_to_id(logits,top_k=0,top_p=0.0,temperature=1.0):
  logits =logits/(temperature if temperature>0 else 1)
  if top_k>0:
    topk_vals,topk_idx = torch.topk(logits,top_k)
    min_topk= topk_vals[-1]
    logits = torch.where(logits<min_topk,torch.tensor(-1e9,device=logits.device),logits)
  if top_p >0.0:
    sorted_logits,sorted_idx = torch.sort(logits,descending=True)
    probs_logits = F.softmax(sorted_logits,dim=-1)
    cumulative_probs_logits = torch.cumsum(probs_logits,dim=-1)
    cutoff = (cumulative_probs_logits>top_p).nonzero(as_tuple=False)
    if cutoff.numel()>0:
      idx_cut = cutoff[0,0].item()
      thresh= sorted_logits[idx_cut]
      logits  = torch.where(logits<thresh, torch.tensor(-1e10,device=logits.device),logits)

  probs = F.softmax(logits,dim=-1)
  next_id = torch.multinomial(probs,num_samples=1)
  return int(next_id.item())

def generate(model, vocab, sp_processor, prompt, max_new_tokens=200, top_k=50, top_p=0.9, temperature=0.9, device='cpu'):
  model.eval()
  pieces = spm_tokenize_text(sp_processor,prompt)
  ids = vocab.encode(pieces)
  x = torch.tensor(ids,dtype=torch.long,device= device).unsqueeze(0)
  for _ in range(max_new_tokens):
    x_cond = x[:,-model.max_seq_len:]
    logits,_ = model(x_cond)
    last_logits = logits[0,-1,:].clone()
    next_id = sample_logits_to_id(last_logits,top_k,top_p,temperature)
    x = torch.cat([x,torch.tensor([[next_id]],device=device)],dim=1)
    if next_id<vocab.size() and vocab.id2token[next_id]=='<EOS>':
      break

  toks_out = vocab.decode(x[0].tolist())
  output = spm_detokenize_pieces(sp_processor,toks_out)
  output = output.replace('<BOS> #','').replace('<EOS>','').replace('<PAD>','').replace('<NL>',':<br>').replace('::',':')
  return output

