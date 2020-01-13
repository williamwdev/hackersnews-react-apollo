import React, { Component } from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import Link from "./Link";

export const FEED_QUERY = gql`
  {
    feed {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`;

export default class LinkList extends Component {
  _updateCacheAfterVote = (store, createVote, linkId) => {
    const data = store.readQuery({ query: FEED_QUERY });

    const votedLink = data.feed.links.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    store.writeQuery({ query: FEED_QUERY, data });
  };

  _subscribeToNewLinks = async () => {
    // ... you'll implement this 🔜
  }

  render() {
    // using gql parser function to write and store the query. The gql function is used to parse the plain string that contains the GraphQL code.

    return (
      // using Query component to pass GraphQL query as prop
      <Query query={FEED_QUERY}>
        {({ loading, error, data, subscribeToMore }) => {
          // loading is true as long as the req is still ongoing and the resp hasn't been received
          if (loading) return <div>Fetching...</div>;
          // in case the req fails, this field will contain info about what exactly went wrong
          if (error) return <div>Error</div>;

          this._subscribeToNewLinks(subscribeToMore)

          // data = actual data that was received from the server. It has the links property which represents a list of link elements
          const linksToRender = data.feed.links;

          return (
            <div>
              {linksToRender.map(link => (
                <Link
                  key={link.id}
                  link={link}
                  // index={index}
                  updateStoreAfterVote={this._updateCacheAfterVote}
                />
              ))}
            </div>
          );
        }}
      </Query>
    );
  }
}
