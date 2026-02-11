const express = require('express');
const Vote = require('../models/Vote');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('creePar', 'nom prenom')
      .populate('reunion', 'titre date')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: votes.length, data: votes });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/active', protect, async (req, res) => {
  try {
    const votes = await Vote.find({ statut: 'ouvert' })
      .populate('creePar', 'nom prenom')
      .populate('reunion', 'titre');

    res.json({ success: true, count: votes.length, data: votes });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id)
      .populate('creePar', 'nom prenom')
      .populate('votants.membre', 'nom prenom');

    if (!vote) {
      return res.status(404).json({ message: 'Vote non trouvé' });
    }

    const aVote = vote.aDejaVote(req.user._id);

    res.json({ 
      success: true, 
      data: vote,
      aVote
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:id/results', protect, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ message: 'Vote non trouvé' });
    }

    const totalVotes = vote.votants.length;
    const resultats = vote.options.map((opt, index) => ({
      option: opt.texte,
      votes: opt.votes,
      pourcentage: totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        sujet: vote.sujet,
        statut: vote.statut,
        totalVotants: totalVotes,
        resultats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/', protect, authorize('president'), async (req, res) => {
  try {
    const voteData = {
      ...req.body,
      creePar: req.user._id,
      options: req.body.options.map(opt => ({
        texte: typeof opt === 'string' ? opt : opt.texte,
        votes: 0
      }))
    };

    const vote = await Vote.create(voteData);
    res.status(201).json({ success: true, data: vote });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
});

router.put('/:id/open', protect, authorize('president'), async (req, res) => {
  try {
    const vote = await Vote.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'ouvert',
        dateOuverture: new Date()
      },
      { new: true }
    );

    if (!vote) {
      return res.status(404).json({ message: 'Vote non trouvé' });
    }

    res.json({ success: true, data: vote, message: 'Vote ouvert' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:id/close', protect, authorize('president'), async (req, res) => {
  try {
    const vote = await Vote.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'ferme',
        dateFermeture: new Date()
      },
      { new: true }
    );

    if (!vote) {
      return res.status(404).json({ message: 'Vote non trouvé' });
    }

    res.json({ success: true, data: vote, message: 'Vote fermé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/:id/cast', protect, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ message: 'Vote non trouvé' });
    }

    if (vote.statut !== 'ouvert') {
      return res.status(400).json({ message: 'Ce vote n\'est pas ouvert' });
    }

    if (vote.aDejaVote(req.user._id)) {
      return res.status(400).json({ message: 'Vous avez déjà voté' });
    }

    if (optionIndex < 0 || optionIndex >= vote.options.length) {
      return res.status(400).json({ message: 'Option invalide' });
    }

    vote.options[optionIndex].votes += 1;
    vote.votants.push({
      membre: req.user._id,
      optionChoisie: optionIndex,
      dateVote: new Date()
    });

    await vote.save();

    res.json({ success: true, message: 'Vote enregistré avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
