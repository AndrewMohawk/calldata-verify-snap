import { ethers } from 'ethers';
import React, { useState } from 'react';
import styled from 'styled-components';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  SendHelloButton,
  SendTXButton,
  Card,
} from '../components';
import { defaultSnapOrigin } from '../config';
import {
  useMetaMask,
  useInvokeSnap,
  useMetaMaskContext,
  useRequestSnap,
} from '../hooks';
import { isLocalSnap, shouldDisplayReconnectButton } from '../utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  color: ${({ theme }) => theme.colors.text?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  word-break: break-all;
  text-wrap: pretty;
  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;




const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnap } = useMetaMask();
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  

  

  // Seed phrase for testing
  const seedPhrase = "great clown skate seek wink liar claim awful buzz work wrap gather";
  
  // Create a wallet from the seed phrase
  const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
  
  // Public and private keys
  const pubkey = wallet.publicKey;
  const privateKey = wallet.privateKey;
  
  console.log(`Public Key: ${pubkey}`);
  console.log(`Private Key: ${privateKey}`);

  const [transactionData, setTransactionData] = useState('testdata');
  const [alert, setAlert] = useState<{ message: string, color: string } | null>(null);

  const signData = async (data: string) => {
    const signature = await wallet.signMessage(data);
    return signature;
  };

  const sendTransaction = async (data: string, includeSignature: boolean, tamperData: boolean) => {
    let transactionData = data;
    let signature = '';

    if (includeSignature) {
      signature = await signData(data);
      if (tamperData) {
        transactionData += 'tampered';
      }
    }

    const [from] = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];

    await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from,
          to: '0x62f8fa6f79e296ad399332649d2b8e61b28bb76c',
          value: '0x0',
          data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(transactionData)) + signature.replace('0x', ''),
        },
      ],
    });

    // Update the alert based on the signature
    if (includeSignature) {
      setAlert({
        message: tamperData ? 'Transaction sent with tampered signature (invalid)' : 'Transaction sent with valid signature',
        color: tamperData ? 'red' : 'green',
      });
    } else {
      setAlert({
        message: 'Transaction sent without signature',
        color: 'gray',
      });
    }
  };

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;


  return (
    <Container>
      <Heading>
        Welcome to <Span>Secure dApp Transactions!</Span>
      </Heading>
      <Subtitle>
        PoC for validating <code>signed</code>, <code>immutable</code> dApp transactions 
      </Subtitle>
      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={requestSnap}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}
        {shouldDisplayReconnectButton(installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={requestSnap}
                  disabled={!installedSnap}
                />
              ),
            }}
            disabled={!installedSnap}
          />
        )}
        <Card
        content={{
          title: 'Send Transaction',
          description: `Send transaction to Wallet`,
          button: (
            <>
              <button onClick={() => sendTransaction(transactionData, false, false)}>Send without Signature</button><br/>
              <button onClick={() => sendTransaction(transactionData, true, false)}>Send with Valid Signature</button><br/>
              <button onClick={() => sendTransaction(transactionData, true, true)}>Send with Tampered Data</button>
            </>
          ),
        }}
        disabled={!installedSnap}
        fullWidth={
          isMetaMaskReady &&
          Boolean(installedSnap) &&
          !shouldDisplayReconnectButton(installedSnap)
        }
      />
       
        <Notice>
          <p>
            Current Public Key: <br/><b>{pubkey}</b>
            
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;
