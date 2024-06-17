import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { panel, text,row, heading,spinner } from '@metamask/snaps-sdk';
import { ethers } from 'ethers';
let global_recoveredPubkey = "";
export const onTransaction: OnTransactionHandler = async ({ transaction, chainId, transactionOrigin }) => {

  // lets declare bools for hasSDT file, hasSignature, and isSignatureValid
  let hasSDT = false;
  let hasSignature = false;
  let isSignatureValid = false;
  let possibleSignature = "";
  let nonSignatureData = "";
  let insights: any[] = [];

  const sdt_url = `${transactionOrigin}/.well-known/sdt.json`;
  insights.push({ value: `Fetching from ${sdt_url}` });

  const sdt_json = await getJson(sdt_url);
  if(!sdt_json) {
    insights.push({ value: "No SDT file found or malformed json" });
  }
  else {
    hasSDT = true;
    insights.push({ value: "pubkey: " + sdt_json.pubkey });

    const data = transaction.data;

    // Define the signature length (130 hex characters for a 65-byte signature)
    const signatureLength = 130;

    if (data.length > signatureLength) {
       possibleSignature = '0x' + data.slice(-signatureLength);
       nonSignatureData = ethers.utils.toUtf8String(data.slice(0, -signatureLength));
      
      if (verifySignature(nonSignatureData, possibleSignature, sdt_json.pubkey)) {
        hasSignature = true;
        isSignatureValid = true;
        insights.push({ value: "Signature found in data" });
        insights.push({ value: "data: " + nonSignatureData });
        insights.push({ value: "signature: " + possibleSignature });
        insights.push({ value: "Signature is valid" });
        // now we should remove the signature from the data
        transaction.data = nonSignatureData
      } else {
        hasSignature = true;
        isSignatureValid = false;
        insights.push({ value: "Signature is invalid" });
      }
    } else {
      insights.push({ value: "No valid signature found in the data" });
    }
  }
  let alertText = [];
  alertText.push(heading("Calldata Verify Snap ( SDT )"));
  
  if(hasSDT) {
    //alertText += "✅ SDT file found\
    alertText.push(row("SDT file found", text("✅")))
  }
  else {
    alertText.push(row("SDT file found", text("❌")))
  }

  if(hasSignature) {
    alertText.push(row("Signature found in data", text("✅")))
  }
  else {
    alertText.push(row("Signature found in data", text("❌")))
  }

  if(isSignatureValid) {
    alertText.push(row("Signature is valid", text("✅")))
  }
  else {
    alertText.push(row("Signature is valid", text("❌")))
  }
  



  //...(insights.map((insight) => text(insight.value))),
  // push all insites to alertText
  alertText.push(heading(""));
  alertText.push(heading(""));
  alertText.push(heading("Data"));
  //alertText.push(row("Origin URL", text(`${transactionOrigin})`)));
  alertText.push(row("SDT URL", text(`${sdt_url}`)));
  
  alertText.push(heading("Transaction Info"));
  alertText.push(...insights.map((insight) => text(insight.value)));

  return {
    content: panel(
     alertText,
    ),
    severity: "critical",
  };
};

const getJson = async (url: string): Promise<any> => {
  const response = await fetch(url);
  if (!response.ok) {
    //throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return false;
  }
  return response.json();
};




// Function to verify the signature
const verifySignature = (data: string, signature: string, pubkey: string): boolean => {
  console.log(`VS Data: ${data}`);
  console.log(`VS Signature: ${signature}`);
  const recoveredPubkey = ethers.utils.recoverPublicKey(
    ethers.utils.hashMessage(data),
    signature
  );
  console.log(`VS Recovered Public Key: ${recoveredPubkey}`);
  return recoveredPubkey.toLowerCase() === pubkey.toLowerCase();
};



