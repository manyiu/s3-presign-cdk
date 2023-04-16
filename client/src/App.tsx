import axios from "axios";
import { ChangeEvent } from "react";
import "./App.css";

const graphqlUrl = "https://xyz.appsync-api.us-east-1.amazonaws.com/graphql";

function App() {
  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];

    if (!file) {
      return;
    }

    const name = file.name;
    const size = file.size;
    const type = file.type;
    const operationName = "MyMutation";

    const response = await axios.post(
      graphqlUrl,
      {
        query: `
        mutation ${operationName}($input: PresignInput!) {
          presign (input: $input) {
            url
            expiresIn
          }
        }
      `,
        operationName,
        variables: {
          input: {
            name,
            size,
            type,
          },
        },
      },
      {
        headers: {
          Authorization: "test",
        },
      }
    );

    console.log(response.data.data.presign.url);

    const presignedUrl = response.data.data.presign.url;

    const uploadResponse = await axios.put(presignedUrl, file);

    console.log(uploadResponse);
  };

  return (
    <div className="App">
      <input
        type="file"
        aria-label="file-upload"
        onChange={(event) => onFileChange(event)}
      />
    </div>
  );
}

export default App;
