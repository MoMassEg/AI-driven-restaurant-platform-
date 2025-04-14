import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix

app = Flask(__name__)
CORS(app)

# Load datasets
df = pd.read_csv('data/1662574418893344.csv')
rating = pd.read_csv('data/ratings.csv')[:511]

df = df.reset_index()
df['Food_ID'] = df['Food_ID'].astype(int)

# Create rating matrix
rating_matrix = rating.pivot_table(index='Food_ID', columns='User_ID', values='Rating').fillna(0)
csr_rating_matrix = csr_matrix(rating_matrix.values)

# Train model
recommender = NearestNeighbors(metric='cosine')
recommender.fit(csr_rating_matrix)

def Get_Recommendations(title):
    food_entry = df[df['Name'] == title]
    if food_entry.empty:
        return []
    
    food_id = int(food_entry['Food_ID'].iloc[0])
    user_index = np.where(rating_matrix.index == food_id)[0]

    if len(user_index) == 0:
        return []

    user_ratings = rating_matrix.iloc[user_index[0]].values.reshape(1, -1)
    distances, indices = recommender.kneighbors(user_ratings, n_neighbors=6)
    nearest_neighbors = rating_matrix.iloc[indices[0][1:]].index.tolist()

    return df[df['Food_ID'].isin(nearest_neighbors)]['Name'].tolist()

@app.route('/recommend', methods=['GET'])
def recommend():
    title = request.args.get('title')
    if not title:
        return jsonify({'error': 'Title parameter is required'}), 400

    recommendations = Get_Recommendations(title)
    
    if not recommendations:
        return jsonify({'error': 'No recommendations found'}), 404

    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    app.run(debug=True, port=5500)
