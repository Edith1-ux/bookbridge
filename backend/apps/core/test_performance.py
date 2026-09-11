import json
from django.test import TestCase, override_settings
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.colleges.models import College, Department, Course
from apps.books.models import Book, Wishlist
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim
from apps.chat.models import ChatMessage


class QueryOptimizationAndAggregationTestCase(TestCase):
    """Test that aggregations and query optimizations minimize SQL roundtrips."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.college = College.objects.create(name='Government Engineering College', code='GEC', city='Ahmedabad', state='Gujarat')
        self.department = Department.objects.create(college=self.college, name='Computer Engineering', code='CE')
        self.course = Course.objects.create(department=self.department, name='Database Management Systems', code='3130703', semester=3)

        self.admin_user = User.objects.create_superuser(
            email='perf_admin@bookbridge.edu',
            password='AdminPassword123!',
            full_name='Performance Admin',
            role='SUPER_ADMIN',
            college=self.college,
            department=self.department
        )
        self.student = User.objects.create_user(
            email='perf_student@bookbridge.edu',
            password='StudentPassword123!',
            full_name='Performance Student',
            role='STUDENT',
            college=self.college,
            department=self.department
        )

        for i in range(5):
            Book.objects.create(
                seller=self.student,
                title=f"Book {i}",
                author=f"Author {i}",
                branch="CE",
                semester=3,
                price=150.00 + i,
                mode="sell",
                status="Available"
            )

    def test_statistics_caching_and_query_efficiency(self):
        # 1. First call computes and sets cache
        res1 = self.client.get('/api/statistics/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        data1 = res1.json()
        self.assertEqual(data1['books_listed'], 5)

        # 2. Second call must be served from cache with 0 DB queries
        with self.assertNumQueries(0):
            res2 = self.client.get('/api/statistics/')
            self.assertEqual(res2.status_code, status.HTTP_200_OK)
            self.assertEqual(res2.json()['books_listed'], 5)

    def test_admin_stats_view_optimized_aggregations(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('totalUsers', data)
        self.assertIn('totalListings', data)
        self.assertEqual(data['totalListings'], 5)
        self.assertEqual(data['availableListings'], 5)

    def test_admin_analytics_view_returns_expected_structure(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('monthlyTrends', data)
        self.assertEqual(len(data['monthlyTrends']), 6)
        self.assertIn('branchDistribution', data)
        self.assertIn('modeBreakdown', data)
        self.assertIn('conditionBreakdown', data)


class ModelIndexesVerificationTestCase(TestCase):
    """Verify that all target performance indexes exist on models."""

    def test_book_model_has_compound_indexes(self):
        index_names = [idx.name for idx in Book._meta.indexes]
        self.assertIn('book_status_mode_idx', index_names)
        self.assertIn('book_branch_sem_idx', index_names)
        self.assertIn('book_gtu_code_idx', index_names)
        self.assertIn('book_created_at_idx', index_names)
        self.assertIn('book_seller_idx', index_names)

    def test_user_model_has_compound_indexes(self):
        index_names = [idx.name for idx in User._meta.indexes]
        self.assertIn('user_role_active_idx', index_names)
        self.assertIn('user_college_active_idx', index_names)
        self.assertIn('user_date_joined_idx', index_names)

    def test_exchange_proposal_model_has_indexes(self):
        index_names = [idx.name for idx in ExchangeProposal._meta.indexes]
        self.assertIn('exch_status_created_idx', index_names)
        self.assertIn('exch_proposer_status_idx', index_names)
        self.assertIn('exch_target_status_idx', index_names)

    def test_donation_claim_model_has_indexes(self):
        index_names = [idx.name for idx in DonationClaim._meta.indexes]
        self.assertIn('don_status_created_idx', index_names)
        self.assertIn('don_claimer_status_idx', index_names)
        self.assertIn('don_book_status_idx', index_names)

    def test_wishlist_model_has_indexes(self):
        index_names = [idx.name for idx in Wishlist._meta.indexes]
        self.assertIn('wish_user_created_idx', index_names)

    def test_chat_message_model_has_indexes(self):
        index_names = [idx.name for idx in ChatMessage._meta.indexes]
        self.assertIn('chat_sender_ts_idx', index_names)
        self.assertIn('chat_recver_ts_idx', index_names)
        self.assertIn('chat_ts_idx', index_names)


class CourseViewSetSelectRelatedTestCase(TestCase):
    """Verify CourseViewSet uses select_related to prevent N+1 queries."""

    def setUp(self):
        self.client = APIClient()
        self.college = College.objects.create(name='L.D. College of Engineering', code='LDCE', city='Ahmedabad', state='Gujarat')
        self.department = Department.objects.create(college=self.college, name='Information Technology', code='IT')
        for i in range(10):
            Course.objects.create(
                department=self.department,
                name=f"Course {i}",
                code=f"314070{i}",
                semester=4
            )

    def test_course_list_executes_minimal_queries(self):
        # 1 query for count (pagination) + 1 query for course + department + college
        with self.assertNumQueries(2):
            response = self.client.get('/api/v1/colleges/courses/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            results = response.json().get('results', response.json())
            self.assertEqual(len(results), 10)
            self.assertEqual(results[0]['department_name'], 'Information Technology')
