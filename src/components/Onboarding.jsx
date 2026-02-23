import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import './Onboarding.css';

const TOPICS = [
    "Artificial Intelligence", "Web Development", "Mobile Apps",
    "Blockchain & Crypto", "Cloud Computing", "Gaming",
    "Cybersecurity", "Hardware", "Startups", "Space Tech"
];

const Onboarding = ({ onComplete }) => {
    const { saveTopics } = useStorage();
    const [selectedTopics, setSelectedTopics] = useState([]);

    const toggleTopic = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const handleNext = () => {
        if (selectedTopics.length > 0) {
            saveTopics(selectedTopics);
            onComplete();
        }
    };

    return (
        <div className="onboarding-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card onboarding-card"
            >
                <div className="card-gradient-top"></div>

                <div className="onboarding-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <img src="/icons/icon-128.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: '8px' }} />
                    <h1 className="title-gradient" style={{ marginBottom: 0 }}>Global Tech Trends</h1>
                </div>
                <p className="subtitle">
                    Select your interests to generate your personalized tech feed.
                </p>

                <div className="topic-grid">
                    {TOPICS.map((topic) => (
                        <button
                            key={topic}
                            onClick={() => toggleTopic(topic)}
                            className={`topic-btn ${selectedTopics.includes(topic) ? 'active' : ''}`}
                        >
                            {topic}
                            {selectedTopics.includes(topic) && (
                                <CheckCircle size={14} style={{ marginLeft: 6, flexShrink: 0 }} />
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    disabled={selectedTopics.length === 0}
                    className="btn-primary full-width"
                >
                    Start Exploring <ArrowRight size={20} />
                </button>
            </motion.div>
        </div>
    );
};

export default Onboarding;
