import sys
import torch
import sentencepiece as spm
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


from model_components import Vocab, tinyTransformerDecoderOnly, generate

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


sp_processor = spm.SentencePieceProcessor()
sp_processor.load("/Users/dangnguyengroup/NN-DL/Code Assistant/codethium-model/fullspm.model")

vocab_path = "/Users/dangnguyengroup/NN-DL/Code Assistant/codethium-model/vocab.pth"
portable_vocab_path = "/Users/dangnguyengroup/NN-DL/Code Assistant/codethium-model/vocab_portable.pth"

def load_vocab(path, portable_path, sp_processor, device):
    
    try:
        
        sys.modules["__main__"] = sys.modules["model_components"]

        vocab = torch.load(path, map_location=device, weights_only=False)

        if isinstance(vocab, Vocab):
            
            torch.save(
                {"id2token": vocab.id2token, "token2id": vocab.token2id},
                portable_path
            )
            return vocab

        # If it's a dict
        if isinstance(vocab, dict) and "id2token" in vocab and "token2id" in vocab:
            v = Vocab(sp_processor)
            v.id2token = vocab["id2token"]
            v.token2id = vocab["token2id"]
            return v

        raise RuntimeError("Unknown vocab format")

    except Exception as e:
        raise RuntimeError(f"Failed to load vocab from {path}: {e}")

vocab = load_vocab(vocab_path, portable_vocab_path, sp_processor, device)

model_cfg = dict(
    n_layers=4,
    n_heads=4,
    d_model=256,
    max_seq_len=512,
)

model = tinyTransformerDecoderOnly(
    vocab_size=vocab.size(),
    d_model=model_cfg["d_model"],
    n_heads=model_cfg["n_heads"],
    n_layers=model_cfg["n_layers"],
    max_seq_len=model_cfg["max_seq_len"],
).to(device)


state_dict_path = "/Users/dangnguyengroup/NN-DL/Code Assistant/codethium-model/tiny_transformer.pth"
state_dict = torch.load(state_dict_path, map_location=device, weights_only=True)


if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
    state_dict = state_dict["model_state_dict"]

model.load_state_dict(state_dict)
model.eval()

# === API ===
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    prompt = "<BOS> # problem: " + req.message.strip() + " <NL> "
    output = generate(model, vocab, sp_processor, prompt, device=device)
    return {"reply": output}

if __name__ == "__main__":
    
    uvicorn.run("decoder_only_model:app", host="0.0.0.0", port=8000, reload=True)

