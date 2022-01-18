import React, { useState, useEffect, useRef } from 'react';
import randomWords from 'random-words';
import copy from 'copy-to-clipboard';

const URL = 'wss://2rh2z93erf.execute-api.us-east-1.amazonaws.com/dev';

export default function () {
  const [channel, setChannel] = useState(() => randomWords(3).join('.'));
  const [snippet, setSnippet] = useState('');
  const [snippets, setSnippets] = useState([]);
  const webSocket = useRef(null);

  useEffect(() => {
    webSocket.current = new WebSocket(URL);
    webSocket.current.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      switch (payload.action) {
        case 'CHANNEL_JOINED':
          setSnippets(payload.data.snippets);
          break;
        case 'NEW_SNIPPET':
          setSnippets((prev) => [payload.data, ...prev]);
          break;
        default:
          break;
      }
    };

    return () => {
      webSocket.current.close();
      webSocket.current = null;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', (evt) => {
      if ((evt.ctrlKey || evt.metaKey) && evt.code === 'KeyV') {
        document.getElementById('new-snippet').focus();
        setTimeout(() => {
          document.getElementById('send-message-btn').click();
        }, 10);
      }
    });
  }, []);

  function join() {
    webSocket.current.send(
      JSON.stringify({ action: 'JOIN_CHANNEL', data: { channelId: channel } }),
    );
  }

  function sendMessage() {
    if (webSocket.current && snippet && channel) {
      webSocket.current.send(
        JSON.stringify({
          action: 'SAVE_SNIPPET',
          data: { channelId: channel, snippet },
        }),
      );
      setSnippet('');
    }
  }

  return (
    <>
      <input
        type="text"
        onChange={(evt) => setChannel(evt.target.value)}
        value={channel}
      />
      <button type="button" onClick={join}>
        Join
      </button>
      <br />
      <textarea id="new-snippet" onChange={(evt) => setSnippet(evt.target.value)} value={snippet} />
      <button id="send-message-btn" type="button" onClick={sendMessage}>
        Send message
      </button>
      <br />
      {snippets.map((snippet) => (
        <div key={snippet.snippetId}>
          <button type="button" onClick={() => copy(snippet.snippet)}>Copy</button>
          <div style={{whiteSpace: 'pre-line'}}>{snippet.snippet}</div>
        </div>
      ))}
    </>
  );
}
