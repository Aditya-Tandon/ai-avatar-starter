import { useState, useEffect } from 'react';

import Head from 'next/head';
import Image from 'next/image';
// import buildspaceLogo from '../assets/buildspace-logo.png';
import coolpo from '../assets/cool-po.png';

const Home = () => {
  const maxRetries = 15
  const [input, setInput] = useState('');
  const [img, setImg] = useState('');
  const [retry, setRetry] = useState(0); // num retry we're on
  const [retryCount, setRetryCount] = useState(maxRetries); //num retires left
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');
  const onChange = (event) => {
    setInput(event.target.value);
  };

  const generateAction = async () => {
    console.log('Generating...');

    if (isGenerating && retry === 0) {
      return;
    }

    setIsGenerating(true);
    // to handle retries upto maxRetries in case of error 503
    if (retry > 0) {
      setRetryCount((prevState => {
        if (prevState === 0) {
          return 0;
        } else {
          return (prevState - 1);
        }
      }));

      setRetry(0);
    }

    //API call
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ input })
    })

    const data = await response.json();

    //checking for errors in response received after API call
    if (response.status == 503) {
      console.log('Model is still loading.');
      setRetry(data.estimated_time);
      return;
    }

    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      setIsGenerating(false);
      return;
    }

    setFinalPrompt(input); //showin off prompt after generating
    setInput(''); //resetting input field after generating 
    setImg(data.image); //to display image
    setIsGenerating(false);
  }

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  // waiting for some time before retrying
  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
        setRetryCount(maxRetries);
        return;
      }

      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  return (
    <div className="root">
      <Head>
        <title>AI Avatar Generator</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Pixar Character Generator</h1>
          </div>
          <div className="header-subtitle">
            <h2>Turn me into anything you want! Just refer to me as aditya in the prompt</h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} />
            <div className="prompt-buttons">
              <a className={
                isGenerating ? 'generate-button loading' : 'generate-button'
              }
                onClick={generateAction}
              >
                <div className="generate">
                  {
                    isGenerating ? (<span className='loader'> </span>) : (<p>Generate</p>)
                  }
                </div>
              </a>
            </div>
          </div>
        </div>
        {img && (
          <div className="output-content">
            <Image src={img} width={512} height={512} alt={input} />
            <p> {finalPrompt} </p>
          </div>
        )}
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={coolpo} alt="buildspace logo" />
            <p>built with sheer awesomeness in mind</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;
