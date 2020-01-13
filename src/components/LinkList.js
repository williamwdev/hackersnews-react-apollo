import React, { Component } from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import Link from "./Link";
import { LINKS_PER_PAGE } from '../constants';

export const FEED_QUERY = gql`
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
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
      count
    }
  }
`;

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
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
`;

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
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
      user {
        id
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

  _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION, // document represents the subscription query itself. Subscription will fire every time a new link is created
      updateQuery: (prev, { subscriptionData }) => {
        // this function allows you to determine how the store should be updated with the information that was sent by the server after the event occurred. (Similar to Redux reducer)
        if (!subscriptionData.data) return prev;
        const newLink = subscriptionData.data.newLink;
        const exists = prev.feed.links.find(({ id }) => id === newLink.id);
        if (exists) return prev;

        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename
          }
        });
      }
    });
  };

  _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION
    });
  };

  _getQueryVariables = () => {
    const isNewPage = this.props.location.pathname.includes('new')
    const page = parseInt(this.props.match.params.page, 10)
  
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0
    const first = isNewPage ? LINKS_PER_PAGE : 100
    const orderBy = isNewPage ? 'createdAt_DESC' : null
    return { first, skip, orderBy }
  }

  render() {
    // using gql parser function to write and store the query. The gql function is used to parse the plain string that contains the GraphQL code.

    return (
      // using Query component to pass GraphQL query as prop
      <Query query={FEED_QUERY} variables={this._getQueryVariables()}>
        {({ loading, error, data, subscribeToMore }) => {
          // loading is true as long as the req is still ongoing and the resp hasn't been received
          if (loading) return <div>Fetching...</div>;
          // in case the req fails, this field will contain info about what exactly went wrong
          if (error) return <div>Error</div>;

          this._subscribeToNewLinks(subscribeToMore);
          this._subscribeToNewLinks(subscribeToMore);
          this._subscribeToNewVotes(subscribeToMore);

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
